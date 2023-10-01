import { ProductViewDetail } from '@aws-sdk/client-service-catalog';
import { AwsServiceCatalogIntegration } from '../../integrations/aws-service-catalog/service';
import { GroupService } from '../group/service';
import { AwsCloudformationIntegration } from '../../integrations/aws-cloudformation/service';
import { InstanceService } from '../instance/service';
import { AwsEc2Integration } from '../../integrations/aws-ec2/service';
import * as schema from '../../drizzle/schema';

export class ProductService {
    private awsServiceCatalogIntegration: AwsServiceCatalogIntegration;
    private awsCloudformationIntegration: AwsCloudformationIntegration;
    private awsEc2Integration: AwsEc2Integration;
    private groupService: GroupService;
    private instanceService: InstanceService;

    constructor(props: {
        awsServiceCatalogIntegration: AwsServiceCatalogIntegration;
        awsCloudformationIntegration: AwsCloudformationIntegration;
        awsEc2Integration: AwsEc2Integration;
        groupService: GroupService;
        instanceService: InstanceService;
    }) {
        this.awsServiceCatalogIntegration = props.awsServiceCatalogIntegration;
        this.awsCloudformationIntegration = props.awsCloudformationIntegration;
        this.awsEc2Integration = props.awsEc2Integration;
        this.groupService = props.groupService;
        this.instanceService = props.instanceService;
    }

    async listUserProducts(userId: number) {
        const awsPortfolioIds = await this.groupService.listUserGroupAwsPortfolioIds(userId);
        const productIdToDetailMap = new Map<string, ProductViewDetail>([]);

        await Promise.all(
            awsPortfolioIds.map(async (awsPortfolioId) => {
                for await (const batch of this.awsServiceCatalogIntegration.paginateListPortfolioProducts(
                    awsPortfolioId,
                )) {
                    for (const product of batch.ProductViewDetails ?? []) {
                        const productId = product.ProductViewSummary?.ProductId;

                        if (productId !== undefined && !productIdToDetailMap.has(productId)) {
                            productIdToDetailMap.set(productId, product);
                        }
                    }
                }
            }),
        );

        return [...productIdToDetailMap.values()].map((product) => ({
            awsProductId: product.ProductViewSummary?.ProductId ?? '',
            awsProductViewId: product.ProductViewSummary?.Id ?? '',
            name: product.ProductViewSummary?.Name ?? '',
            description: product.ProductViewSummary?.ShortDescription ?? '',
            createdAt: product.CreatedTime?.toISOString() ?? '',
        }));
    }

    /**
     * This function gets a provisioned product stack and updates user's instance based on the
     * stack's outputs.
     */
    async linkProvisionedProductToUser(provisionedProductStackName: string) {
        const stack = await this.awsCloudformationIntegration.describeStackByName(
            provisionedProductStackName,
        );

        if (!stack) {
            throw new Error(`Stack ${provisionedProductStackName} not found`);
        }

        const provisionedProductName = stack.Tags?.find(
            (tag) => tag.Key === 'provisionedProductName',
        )?.Value;

        const connectionType = stack.Outputs?.find(
            (output) => output.Description === 'connectionType',
        )?.OutputValue;

        const awsInstanceId = stack.Outputs?.find(
            (output) => output.Description === 'awsInstanceId',
        )?.OutputValue;

        if (!provisionedProductName || !awsInstanceId || !connectionType) {
            throw new Error(
                `Stack ${provisionedProductStackName} is missing required outputs: ${JSON.stringify(
                    { provisionedProductName, connectionType, awsInstanceId },
                )}`,
            );
        }

        const awsInstance = await this.awsEc2Integration.getInstance(awsInstanceId);

        const [awsInstanceType, awsImageDescription, awsInstanceTotalDiskSize, [instanceStatuse]] =
            await Promise.all([
                this.awsEc2Integration.getInstanceTypeData(awsInstance?.InstanceType ?? ''),
                this.awsEc2Integration.getImageDescription(awsInstance?.ImageId ?? ''),
                this.awsEc2Integration.getVolumesTotalSize(
                    awsInstance?.BlockDeviceMappings?.map((bdm) => bdm.Ebs?.VolumeId ?? '') ?? [],
                ),
                this.awsEc2Integration.listInstanceStatuses([awsInstanceId]),
            ]);

        const updatedInstance =
            await this.instanceService.updateInstanceByAwsProvisionedProductName(
                provisionedProductName,
                {
                    awsInstanceId,
                    connectionType:
                        connectionType as keyof typeof schema.instance.connectionType.enumValues.values,
                    cpuCores: awsInstance?.CpuOptions?.CoreCount?.toString(),
                    distribution: awsImageDescription,
                    platform: awsInstance?.PlatformDetails,
                    storageInGb: awsInstanceTotalDiskSize?.toString(),
                    instanceType: awsInstance?.InstanceType,
                    memoryInGb:
                        awsInstanceType?.MemoryInfo?.SizeInMiB !== undefined
                            ? `${awsInstanceType?.MemoryInfo?.SizeInMiB / 1024}`
                            : undefined,
                },
            );

        if (!updatedInstance) {
            return undefined;
        }

        return {
            ...updatedInstance,
            state: instanceStatuse?.InstanceState?.Name,
        };
    }

    parseNotificationMessage(message: string) {
        const parserTemplate = {
            stackName: `StackName='(.*)'`,
            resourceStatus: `ResourceStatus='(.*)'`,
            resourceType: `ResourceType='(.*)'`,
        };

        Object.entries(parserTemplate).forEach(([key, rawRegex]) => {
            const regex = new RegExp(rawRegex);
            const match = message.match(regex);
            parserTemplate[key as keyof typeof parserTemplate] = match ? match[1] : '';
        });

        return parserTemplate;
    }
}
