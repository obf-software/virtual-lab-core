import {
    DescribeImagesCommand,
    DescribeInstanceStatusCommand,
    DescribeInstanceTypesCommand,
    DescribeInstancesCommand,
    DescribeVolumesCommand,
    EC2Client,
    RebootInstancesCommand,
    StartInstancesCommand,
    StopInstancesCommand,
} from '@aws-sdk/client-ec2';
import createHttpError from 'http-errors';
import { VirtualizationGateway } from '../../application/virtualization-gateway';
import { InstanceState } from '../../domain/dtos/instance-state';
import { VirtualInstanceSummary } from '../../domain/dtos/virtual-instance-summary';
import { Errors } from '../../domain/dtos/errors';
import { VirtualInstanceDetailedInfo } from '../../domain/dtos/virtual-instance-detailed-info';
import { VirtualInstanceTemplate } from '../../domain/dtos/virtual-instance-template';
import {
    DescribeProductAsAdminCommand,
    DescribeProvisioningParametersCommand,
    DescribeRecordCommand,
    ListLaunchPathsCommand,
    ProvisionProductCommand,
    ServiceCatalogClient,
    TerminateProvisionedProductCommand,
    paginateSearchProductsAsAdmin,
} from '@aws-sdk/client-service-catalog';
import {
    CloudFormationClient,
    DeleteStackCommand,
    DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { ConfigVault } from '../../application/config-vault';
import { VirtualInstanceLaunchParameters } from '../../domain/dtos/virtual-instance-launch-parameters';
import { randomUUID } from 'node:crypto';
import { VirtualInstanceStack } from '../../domain/dtos/virtual-instance-stack';
import { instanceConnectionTypeSchema } from '../../domain/dtos/instance-connection-type';

export class AwsVirtualizationGateway implements VirtualizationGateway {
    private ec2Client: EC2Client;
    private serviceCatalogClient: ServiceCatalogClient;
    private cloudFormationClient: CloudFormationClient;

    constructor(
        private readonly configVault: ConfigVault,
        AWS_REGION: string,
        private readonly API_SNS_TOPIC_ARN: string,
        private readonly SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME: string,
    ) {
        this.ec2Client = new EC2Client({ region: AWS_REGION });
        this.serviceCatalogClient = new ServiceCatalogClient({ region: AWS_REGION });
        this.cloudFormationClient = new CloudFormationClient({ region: AWS_REGION });
    }

    private mapInstanceState = (stateName?: string): InstanceState => {
        const stateMap: Record<string, InstanceState> = {
            pending: 'PENDING',
            running: 'RUNNING',
            'shutting-down': 'SHUTTING_DOWN',
            stopped: 'STOPPED',
            stopping: 'STOPPING',
            terminated: 'TERMINATED',
        };

        const state = stateMap[stateName?.toLowerCase() ?? ''];

        if (state === undefined) {
            throw Errors.internalError('Instance state not found');
        }

        return state;
    };

    getInstanceSummary = async (virtualId: string): Promise<VirtualInstanceSummary> => {
        const command = new DescribeInstancesCommand({ InstanceIds: [virtualId] });
        const { Reservations } = await this.ec2Client.send(command);
        const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
        if (instances.length === 0) throw Errors.internalError('AWS Instance not found');

        const hostname = instances[0].PublicDnsName;
        const instanceId = instances[0].InstanceId;

        if (hostname === undefined || instanceId === undefined) {
            throw Errors.internalError('AWS Instance does not have a hostname or instance id');
        }

        return {
            hostname: instances[0].PublicDnsName ?? '',
            virtualId: instances[0].InstanceId ?? '',
            state: this.mapInstanceState(instances[0].State?.Name),
        };
    };

    getInstanceDetailedInfo = async (virtualId: string): Promise<VirtualInstanceDetailedInfo> => {
        const { Reservations } = await this.ec2Client.send(
            new DescribeInstancesCommand({ InstanceIds: [virtualId] }),
        );
        const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
        if (instances.length === 0) throw new createHttpError.NotFound('Instance not found');
        const instance = instances[0];
        const instanceType = instance.InstanceType;

        if (instanceType === undefined) {
            throw Errors.internalError('AWS Instance does not have an instance type');
        }

        const [{ InstanceTypes }, { Images }, { Volumes }] = await Promise.all([
            this.ec2Client.send(
                new DescribeInstanceTypesCommand({ InstanceTypes: [instanceType] }),
            ),
            this.ec2Client.send(new DescribeImagesCommand({ ImageIds: [instance.ImageId ?? ''] })),
            this.ec2Client.send(
                new DescribeVolumesCommand({
                    VolumeIds:
                        instance.BlockDeviceMappings?.map((bdm) => bdm.Ebs?.VolumeId ?? '') ?? [],
                }),
            ),
        ]);

        const memoryInMib = InstanceTypes?.[0]?.MemoryInfo?.SizeInMiB ?? 0;

        const storageInGb =
            Volumes?.map((v) => v.Size ?? 0).reduce((acc, curr) => acc + curr, 0) ?? 0;

        return {
            virtualId: instance.InstanceId ?? '',
            state: this.mapInstanceState(instance.State?.Name),
            cpuCores: instance.CpuOptions?.CoreCount?.toString() ?? '0',
            platform: instance.PlatformDetails ?? 'unknown',
            instanceType: instance.InstanceType ?? 'unknown',
            distribution: Images?.[0]?.Description ?? 'unknown',
            memoryInGb: memoryInMib !== 0 ? `${memoryInMib / 1024}` : '0',
            storageInGb: `${storageInGb}`,
        };
    };

    listInstancesStates = async (virtualIds: string[]): Promise<Record<string, InstanceState>> => {
        if (virtualIds.length === 0) return {};

        const command = new DescribeInstanceStatusCommand({
            IncludeAllInstances: true,
            InstanceIds: virtualIds,
        });
        const { InstanceStatuses } = await this.ec2Client.send(command);
        const instanceStates: Record<string, InstanceState> = {};
        InstanceStatuses?.forEach((instanceStatus) => {
            instanceStates[instanceStatus.InstanceId ?? ''] = this.mapInstanceState(
                instanceStatus.InstanceState?.Name,
            );
        });
        return instanceStates;
    };

    getInstanceState = async (virtualId: string): Promise<InstanceState> => {
        const command = new DescribeInstanceStatusCommand({
            IncludeAllInstances: true,
            InstanceIds: [virtualId],
        });
        const { InstanceStatuses } = await this.ec2Client.send(command);
        return this.mapInstanceState(InstanceStatuses?.[0].InstanceState?.Name);
    };

    startInstance = async (virtualId: string): Promise<InstanceState> => {
        const command = new StartInstancesCommand({ InstanceIds: [virtualId] });
        const { StartingInstances } = await this.ec2Client.send(command);
        return this.mapInstanceState(StartingInstances?.[0].CurrentState?.Name);
    };

    stopInstance = async (
        virtualId: string,
        hibernate: boolean,
        force: boolean,
    ): Promise<InstanceState> => {
        const command = new StopInstancesCommand({
            InstanceIds: [virtualId],
            Hibernate: hibernate,
            Force: force,
        });
        const { StoppingInstances } = await this.ec2Client.send(command);
        return this.mapInstanceState(StoppingInstances?.[0].CurrentState?.Name);
    };

    rebootInstance = async (virtualId: string): Promise<void> => {
        const command = new RebootInstancesCommand({ InstanceIds: [virtualId] });
        await this.ec2Client.send(command);
    };

    listInstanceTemplates = async (): Promise<VirtualInstanceTemplate[]> => {
        const serviceCatalogPortfolioId = await this.configVault.getParameter(
            this.SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
        );
        if (serviceCatalogPortfolioId === undefined) {
            throw Errors.internalError(
                `Failed to retrieve ${this.SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME} from config vault`,
            );
        }

        const templates: VirtualInstanceTemplate[] = [];
        const paginator = paginateSearchProductsAsAdmin(
            { client: this.serviceCatalogClient },
            { PortfolioId: serviceCatalogPortfolioId, PageSize: 100 },
        );
        for await (const page of paginator) {
            templates.push(
                ...(page.ProductViewDetails ?? []).map((p) => ({
                    id: p.ProductViewSummary?.ProductId ?? '',
                    name: p.ProductViewSummary?.Name ?? '',
                    description: p.ProductViewSummary?.ShortDescription ?? '',
                })),
            );
        }
        return templates;
    };

    getInstanceTemplate = async (instanceTemplateId: string): Promise<VirtualInstanceTemplate> => {
        const { ProductViewDetail } = await this.serviceCatalogClient.send(
            new DescribeProductAsAdminCommand({ Id: instanceTemplateId }),
        );

        return {
            id: ProductViewDetail?.ProductViewSummary?.ProductId ?? '',
            name: ProductViewDetail?.ProductViewSummary?.Name ?? '',
            description: ProductViewDetail?.ProductViewSummary?.ShortDescription ?? '',
        };
    };

    launchInstance = async (
        instanceTemplateId: string,
        parameters: VirtualInstanceLaunchParameters,
    ): Promise<string> => {
        const launchToken = randomUUID();

        const { LaunchPathSummaries } = await this.serviceCatalogClient.send(
            new ListLaunchPathsCommand({ ProductId: instanceTemplateId }),
        );
        const pathId = LaunchPathSummaries?.[0].Id;

        const { ProvisioningArtifactParameters } = await this.serviceCatalogClient.send(
            new DescribeProvisioningParametersCommand({
                ProductId: instanceTemplateId,
                ProvisioningArtifactName: 'latest',
                PathId: pathId,
            }),
        );

        const provisioningParameters = ProvisioningArtifactParameters?.map((p) => {
            if (p.Description === 'Instance Type') {
                return {
                    Key: p.ParameterKey,
                    Value: parameters.instanceType,
                };
            }
            if (p.Description === 'Enable Hibernation') {
                return {
                    Key: p.ParameterKey,
                    Value: parameters.enableHibernation ? 'true' : 'false',
                };
            }
            return {
                Key: p.ParameterKey,
                Value: p.DefaultValue,
            };
        });

        await this.serviceCatalogClient.send(
            new ProvisionProductCommand({
                ProductId: instanceTemplateId,
                PathId: pathId,
                ProvisioningArtifactName: 'latest',
                ProvisionedProductName: launchToken,
                ProvisionToken: launchToken,
                NotificationArns: [this.API_SNS_TOPIC_ARN],
                ProvisioningParameters: provisioningParameters,
                Tags: [
                    {
                        Key: 'launchToken',
                        Value: launchToken,
                    },
                ],
            }),
        );

        return launchToken;
    };

    terminateInstance = async (launchToken: string): Promise<void> => {
        const { RecordDetail } = await this.serviceCatalogClient.send(
            new TerminateProvisionedProductCommand({
                ProvisionedProductName: launchToken,
                TerminateToken: randomUUID(),
                IgnoreErrors: true,
                RetainPhysicalResources: false,
            }),
        );

        const { RecordOutputs } = await this.serviceCatalogClient.send(
            new DescribeRecordCommand({
                Id: RecordDetail?.RecordId,
            }),
        );

        const cloudformationStackArn = RecordOutputs?.find(
            (output) => output.OutputKey === 'CloudformationStackARN',
        )?.OutputValue;

        if (!cloudformationStackArn) {
            throw Errors.internalError('Cloudformation stack not found');
        }

        await this.cloudFormationClient.send(
            new DeleteStackCommand({
                StackName: cloudformationStackArn,
                ClientRequestToken: randomUUID(),
            }),
        );
    };

    getInstanceStack = async (stackName: string): Promise<VirtualInstanceStack> => {
        const { Stacks } = await this.cloudFormationClient.send(
            new DescribeStacksCommand({ StackName: stackName }),
        );
        const stack = Stacks !== undefined && Stacks.length > 0 ? Stacks[0] : undefined;
        if (!stack) throw Errors.internalError(`Stack ${stackName} not found`);

        const params: Record<string, string | undefined> = {};

        stack.Tags?.forEach((tag) => {
            if (tag.Key !== undefined && tag.Value !== undefined) {
                params[tag.Key] = tag.Value;
            }
        });

        stack.Outputs?.forEach((output) => {
            if (output.Description !== undefined && output.OutputValue !== undefined) {
                params[output.Description] = output.OutputValue;
            }
        });

        const { launchToken, connectionType, instanceId } = params;
        if (!launchToken || !connectionType || !instanceId) {
            throw Errors.internalError(`Stack ${stackName} does not have the required information`);
        }

        return {
            connectionType: instanceConnectionTypeSchema.parse(connectionType),
            virtualId: instanceId,
            launchToken,
        };
    };
}
