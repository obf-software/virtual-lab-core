import {
    CreateImageCommand,
    DescribeImagesCommand,
    DescribeInstanceStatusCommand,
    DescribeInstanceTypesCommand,
    DescribeInstancesCommand,
    EC2Client,
    InstanceTypeInfo,
    RebootInstancesCommand,
    StartInstancesCommand,
    StopInstancesCommand,
    _InstanceType,
} from '@aws-sdk/client-ec2';
import { VirtualizationGateway } from '../../application/virtualization-gateway';
import { InstanceState } from '../../domain/dtos/instance-state';
import { VirtualInstance } from '../../domain/dtos/virtual-instance';
import { Errors } from '../../domain/dtos/errors';
import { Product } from '../../domain/dtos/product';
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
import { MachineImage } from '../../domain/dtos/machine-image';
import { VirtualInstanceType } from '../../domain/dtos/virtual-instance-type';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export class AwsVirtualizationGateway implements VirtualizationGateway {
    private ec2Client: EC2Client;
    private serviceCatalogClient: ServiceCatalogClient;
    private cloudFormationClient: CloudFormationClient;

    private cachedInstanceTypes: VirtualInstanceType[] = [];
    private cachedInstanceTypesAt: Date | undefined;
    private cachedProducts: Product[] = [];
    private cachedProductsAt: Date | undefined;

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

    private mapInstanceType = (instanceType?: InstanceTypeInfo): VirtualInstanceType => {
        const { VCpuInfo, ProcessorInfo, MemoryInfo, GpuInfo, HibernationSupported, NetworkInfo } =
            instanceType ?? {};

        return {
            name: instanceType?.InstanceType ?? '-',
            cpu: {
                cores: VCpuInfo?.DefaultCores ?? 0,
                vCpus: VCpuInfo?.DefaultVCpus ?? 0,
                threadsPerCore: VCpuInfo?.DefaultThreadsPerCore ?? 0,
                clockSpeedInGhz: ProcessorInfo?.SustainedClockSpeedInGhz ?? 0,
                manufacturer: ProcessorInfo?.Manufacturer ?? '-',
            },
            ram: {
                sizeInMb: MemoryInfo?.SizeInMiB ?? 0,
            },
            gpu: {
                totalGpuMemoryInMb: GpuInfo?.TotalGpuMemoryInMiB ?? 0,
                devices:
                    GpuInfo?.Gpus?.map((device) => ({
                        count: device.Count ?? 0,
                        name: device.Name ?? '-',
                        manufacturer: device.Manufacturer ?? '-',
                        memoryInMb: device.MemoryInfo?.SizeInMiB ?? 0,
                    })) ?? [],
            },
            hibernationSupport: HibernationSupported ?? false,
            networkPerformance: NetworkInfo?.NetworkPerformance ?? '-',
        };
    };

    getInstance = async (virtualId: string): Promise<VirtualInstance | undefined> => {
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

    launchInstance = async (
        productId: string,
        parameters: VirtualInstanceLaunchParameters,
    ): Promise<string> => {
        const randomId = randomUUID();
        const launchToken = `virtual-lab-${randomId}-${Date.now()}`;

        const { LaunchPathSummaries } = await this.serviceCatalogClient.send(
            new ListLaunchPathsCommand({ ProductId: productId }),
        );
        const pathId = LaunchPathSummaries?.[0].Id;

        const { ProvisioningArtifactParameters } = await this.serviceCatalogClient.send(
            new DescribeProvisioningParametersCommand({
                ProductId: productId,
                ProvisioningArtifactName: 'latest',
                PathId: pathId,
            }),
        );

        const provisioningParameters = ProvisioningArtifactParameters?.map((p) => {
            if (p.Description === 'idempotencyToken') {
                return {
                    Key: p.ParameterKey,
                    Value: randomId,
                };
            }
            if (p.Description === 'machineImageId') {
                return {
                    Key: p.ParameterKey,
                    Value: parameters.machineImageId,
                };
            }
            if (p.Description === 'instanceType') {
                return {
                    Key: p.ParameterKey,
                    Value: parameters.instanceType,
                };
            }
            if (p.Description === 'ebsVolumeSize') {
                return {
                    Key: p.ParameterKey,
                    Value: parameters.storageInGb.toString(),
                };
            }
            if (p.Description === 'enableHibernation') {
                return {
                    Key: p.ParameterKey,
                    Value: parameters.canHibernate ? 'true' : 'false',
                };
            }
            return {
                Key: p.ParameterKey,
                Value: p.DefaultValue,
            };
        });

        await this.serviceCatalogClient.send(
            new ProvisionProductCommand({
                ProductId: productId,
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

    listProducts = async (): Promise<Product[]> => {
        if (
            this.cachedProducts.length > 0 &&
            dayjs().utc().diff(this.cachedProductsAt, 'minutes') < 10
        ) {
            console.log('Returning cached products');
            return this.cachedProducts;
        }

        const serviceCatalogPortfolioId = await this.configVault.getParameter(
            this.SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
        );
        if (serviceCatalogPortfolioId === undefined) {
            throw Errors.internalError(
                `Failed to retrieve ${this.SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME} from config vault`,
            );
        }

        const products: Product[] = [];
        const paginator = paginateSearchProductsAsAdmin(
            { client: this.serviceCatalogClient },
            { PortfolioId: serviceCatalogPortfolioId, PageSize: 100 },
        );
        for await (const page of paginator) {
            products.push(
                ...(page.ProductViewDetails ?? []).map((p) => ({
                    id: p.ProductViewSummary?.ProductId ?? '',
                    name: p.ProductViewSummary?.Name ?? '',
                    description: p.ProductViewSummary?.ShortDescription ?? '',
                })),
            );
        }

        this.cachedProducts = products;
        this.cachedProductsAt = dayjs().utc().toDate();
        return products;
    };

    getProductById = async (productId: string): Promise<Product | undefined> => {
        try {
            const { ProductViewDetail } = await this.serviceCatalogClient.send(
                new DescribeProductAsAdminCommand({ Id: productId }),
            );

            return {
                id: ProductViewDetail?.ProductViewSummary?.ProductId ?? '',
                name: ProductViewDetail?.ProductViewSummary?.Name ?? '',
                description: ProductViewDetail?.ProductViewSummary?.ShortDescription ?? '',
            };
        } catch (error) {
            console.log(error);
            return undefined;
        }
    };

    getMachineImageById = async (machineImageId: string): Promise<MachineImage | undefined> => {
        try {
            const { Images } = await this.ec2Client.send(
                new DescribeImagesCommand({ ImageIds: [machineImageId] }),
            );

            if (!Images || Images?.length === 0) return undefined;
            const image = Images[0];

            const storageInGb =
                image.BlockDeviceMappings?.map((i) => i.Ebs?.VolumeSize ?? 0)?.reduce(
                    (acc, curr) => acc + curr,
                    0,
                ) ?? 0;

            let platform: MachineImage['platform'] = 'UNKNOWN';

            if (
                image.Platform === 'Windows' ||
                image.PlatformDetails?.toLowerCase().includes('windows')
            ) {
                platform = 'WINDOWS';
            } else if (image.PlatformDetails?.toLowerCase().includes('linux')) {
                platform = 'LINUX';
            }

            return {
                id: machineImageId,
                storageInGb,
                platform,
                distribution: image.Description ?? 'unknown',
            };
        } catch (error) {
            console.log(error);
            return undefined;
        }
    };

    createMachineImage = async (virtualId: string, storageInGb: number): Promise<string> => {
        const imageName = `virtual-lab-${randomUUID()}`;

        const { Reservations } = await this.ec2Client.send(
            new DescribeInstancesCommand({
                InstanceIds: [virtualId],
            }),
        );

        const instance = Reservations?.[0].Instances?.[0];

        if (!instance) {
            throw Errors.internalError('Instance not found');
        }

        const machineImage = await this.getMachineImageById(instance.ImageId ?? '');

        if (!machineImage) {
            throw Errors.internalError('Machine image not found');
        }

        const blockDeviceMappings = instance.BlockDeviceMappings?.map((mapping) => ({
            ...mapping,
            Ebs: {
                ...mapping.Ebs,
                VolumeSize: storageInGb,
            },
        }));

        const { ImageId } = await this.ec2Client.send(
            new CreateImageCommand({
                InstanceId: virtualId,
                Name: imageName,
                Description: machineImage.distribution,
                NoReboot: false,
                BlockDeviceMappings: blockDeviceMappings,
            }),
        );

        if (!ImageId) {
            throw Errors.internalError('Failed to create machine image');
        }

        return ImageId;
    };

    getInstanceType = async (instanceType: string): Promise<VirtualInstanceType | undefined> => {
        try {
            const { InstanceTypes } = await this.ec2Client.send(
                new DescribeInstanceTypesCommand({
                    InstanceTypes: [instanceType as _InstanceType],
                }),
            );

            if (!InstanceTypes || InstanceTypes.length === 0) return undefined;

            return this.mapInstanceType(InstanceTypes[0]);
        } catch (error) {
            console.log(error);
            return undefined;
        }
    };

    listInstanceTypes = async (instanceTypes?: string[]): Promise<VirtualInstanceType[]> => {
        try {
            if (instanceTypes !== undefined && instanceTypes.length === 0) {
                return [];
            }

            if (
                instanceTypes === undefined &&
                this.cachedInstanceTypes.length > 0 &&
                dayjs().utc().diff(this.cachedInstanceTypesAt, 'minutes') < 10
            ) {
                console.log('Returning cached instance types');
                return this.cachedInstanceTypes;
            }

            const fetchedInstanceTypes: VirtualInstanceType[] = [];
            let nextToken: string | undefined;

            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { InstanceTypes, NextToken } = await this.ec2Client.send(
                    new DescribeInstanceTypesCommand({
                        InstanceTypes: instanceTypes as _InstanceType[] | undefined,
                        Filters:
                            instanceTypes === undefined
                                ? [
                                      { Name: 'bare-metal', Values: ['false'] },
                                      { Name: 'current-generation', Values: ['true'] },
                                      { Name: 'supported-usage-class', Values: ['on-demand'] },
                                      { Name: 'supported-virtualization-type', Values: ['hvm'] },
                                  ]
                                : undefined,
                        MaxResults: 100,
                        NextToken: nextToken,
                    }),
                );

                fetchedInstanceTypes.push(
                    ...(InstanceTypes?.map((instanceType) => this.mapInstanceType(instanceType)) ??
                        []),
                );

                if (NextToken !== undefined) {
                    console.log('NextToken', NextToken, InstanceTypes?.length);
                    nextToken = NextToken;
                } else {
                    break;
                }
            }

            if (instanceTypes === undefined) {
                this.cachedInstanceTypes = fetchedInstanceTypes;
                this.cachedInstanceTypesAt = dayjs().utc().toDate();
            }

            return fetchedInstanceTypes;
        } catch (error) {
            console.log(error);
            return [];
        }
    };
}
