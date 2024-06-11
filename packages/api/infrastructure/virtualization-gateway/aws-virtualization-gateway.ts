import {
    CreateImageCommand,
    DescribeImagesCommand,
    DescribeInstanceStatusCommand,
    DescribeInstanceTypesCommand,
    DescribeInstancesCommand,
    EC2Client,
    EC2ServiceException,
    Image,
    InstanceStatus,
    InstanceTypeInfo,
    RebootInstancesCommand,
    StartInstancesCommand,
    StopInstancesCommand,
    _InstanceType,
    paginateDescribeInstanceStatus,
    paginateDescribeInstanceTypes,
} from '@aws-sdk/client-ec2';
import {
    VirtualizationGateway,
    VirtualizationGatewayScheduleOperation,
} from '../../application/virtualization-gateway';
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
import { InstancePlatform } from '../../domain/dtos/instance-platform';
import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    ResourceNotFoundException,
    SchedulerClient,
} from '@aws-sdk/client-scheduler';
import { Logger } from '../../application/logger';
import { MachineImageState } from '../../domain/dtos/machine-image-state';

dayjs.extend(utc);

export class AwsVirtualizationGateway implements VirtualizationGateway {
    private ec2Client: EC2Client;
    private serviceCatalogClient: ServiceCatalogClient;
    private cloudFormationClient: CloudFormationClient;
    private schedulerClient: SchedulerClient;

    private cachedInstanceTypes: VirtualInstanceType[] = [];
    private cachedInstanceTypesAt: Date | undefined;

    private cachedServiceCatalogLinuxProduct: Product | undefined;
    private cachedServiceCatalogWindowsProduct: Product | undefined;

    private cachedMachineImages: MachineImage[] = [];
    private cachedMachineImagesAt: Date | undefined;

    constructor(
        private readonly deps: {
            readonly logger: Logger;
            readonly configVault: ConfigVault;
            readonly AWS_REGION: string;
            readonly SNS_TOPIC_ARN: string;
            readonly SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME: string;
            readonly SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME: string;
            readonly EVENT_BUS_ARN: string;
            readonly EVENT_BUS_PUBLISHER_ROLE_ARN: string;
        },
    ) {
        this.ec2Client = new EC2Client({ region: deps.AWS_REGION });
        this.serviceCatalogClient = new ServiceCatalogClient({ region: deps.AWS_REGION });
        this.cloudFormationClient = new CloudFormationClient({ region: deps.AWS_REGION });
        this.schedulerClient = new SchedulerClient({ region: deps.AWS_REGION });
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

    private mapMachineImageState = (stateName?: string): MachineImageState => {
        const stateMap: Record<string, MachineImageState> = {
            available: 'AVAILABLE',
            deregistered: 'DEREGISTERED',
            disabled: 'DISABLED',
            error: 'ERROR',
            failed: 'FAILED',
            invalid: 'INVALID',
            pending: 'PENDING',
            transient: 'TRANSIENT',
        };

        const state = stateMap[stateName?.toLowerCase() ?? ''];

        if (state === undefined) {
            throw Errors.internalError('Machine image state not found');
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

    private getScheduledOperationName = (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
    ): string => {
        return `virtual-lab-core-${virtualId}-${operation}`;
    };

    private parseMachineImagePlatform = (image?: Image): InstancePlatform => {
        let platform: MachineImage['platform'] = 'UNKNOWN';

        const { Platform, PlatformDetails } = image ?? {};

        if (Platform === 'Windows' || PlatformDetails?.toLowerCase().includes('windows')) {
            platform = 'WINDOWS';
        } else if (PlatformDetails?.toLowerCase().includes('linux')) {
            platform = 'LINUX';
        }

        return platform;
    };

    isInstanceReadyToConnect = async (virtualId: string): Promise<boolean> => {
        try {
            const command = new DescribeInstanceStatusCommand({
                InstanceIds: [virtualId],
                IncludeAllInstances: true,
            });

            const { InstanceStatuses } = await this.ec2Client.send(command);

            if (InstanceStatuses === undefined || InstanceStatuses.length === 0) {
                throw Errors.internalError('AWS Instance not found');
            }

            const instanceStatus = InstanceStatuses[0];

            return (
                instanceStatus.InstanceStatus?.Status === 'ok' &&
                instanceStatus.SystemStatus?.Status === 'ok'
            );
        } catch (error) {
            this.deps.logger.error('Failed to check if instance is ready to connect', {
                error,
                virtualId,
            });
            return false;
        }
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

        const execute = async (
            ids: string[],
            invalidIds: string[],
        ): Promise<Record<string, InstanceState>> => {
            try {
                const results: InstanceStatus[] = [];

                const idsToFecth = ids.filter((id) => !invalidIds.includes(id));

                if (idsToFecth.length !== 0) {
                    for await (const page of paginateDescribeInstanceStatus(
                        { client: this.ec2Client },
                        {
                            InstanceIds: ids.filter((id) => !invalidIds.includes(id)),
                            IncludeAllInstances: true,
                        },
                    )) {
                        results.push(...(page.InstanceStatuses ?? []));
                    }
                }

                const instanceStates: Record<string, InstanceState> = {};
                results.forEach((instanceStatus) => {
                    instanceStates[instanceStatus.InstanceId ?? ''] = this.mapInstanceState(
                        instanceStatus.InstanceState?.Name,
                    );
                });

                invalidIds.forEach((id) => {
                    instanceStates[id] = 'TERMINATED';
                });

                return instanceStates;
            } catch (error) {
                this.deps.logger.error('Failed to list instances states', { error });

                if (error instanceof EC2ServiceException) {
                    if (error.name === 'InvalidInstanceID.NotFound') {
                        const instanceId = error.message.slice(
                            error.message.indexOf("'") + 1,
                            error.message.lastIndexOf("'"),
                        );

                        return execute(ids, [...invalidIds, instanceId]);
                    }
                }

                throw error;
            }
        };

        return await execute(virtualIds, []);
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
                NotificationArns: [this.deps.SNS_TOPIC_ARN],
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

    getProductByInstancePlatform = async (platform: InstancePlatform): Promise<Product> => {
        if (platform === 'UNKNOWN') {
            throw Errors.internalError('Unknown instance platform');
        }

        let productId: string | undefined;

        if (platform === 'LINUX') {
            if (this.cachedServiceCatalogLinuxProduct !== undefined) {
                return this.cachedServiceCatalogLinuxProduct;
            }

            productId = await this.deps.configVault.getParameter(
                this.deps.SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
            );
        } else if (platform === 'WINDOWS') {
            if (this.cachedServiceCatalogWindowsProduct !== undefined) {
                return this.cachedServiceCatalogWindowsProduct;
            }

            productId = await this.deps.configVault.getParameter(
                this.deps.SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
            );
        }

        if (productId === undefined) {
            throw Errors.internalError('Product not found');
        }

        const { ProductViewDetail } = await this.serviceCatalogClient.send(
            new DescribeProductAsAdminCommand({ Id: productId }),
        );

        const product = {
            id: ProductViewDetail?.ProductViewSummary?.ProductId ?? '',
            name: ProductViewDetail?.ProductViewSummary?.Name ?? '',
            description: ProductViewDetail?.ProductViewSummary?.ShortDescription ?? '',
        };

        if (platform === 'LINUX') {
            this.cachedServiceCatalogLinuxProduct = product;
        } else if (platform === 'WINDOWS') {
            this.cachedServiceCatalogWindowsProduct = product;
        }

        return product;
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

            return {
                id: machineImageId,
                storageInGb,
                platform: this.parseMachineImagePlatform(image),
                distribution: image.Description ?? 'unknown',
                state: this.mapMachineImageState(image.State),
            };
        } catch (error) {
            console.log(error);
            return undefined;
        }
    };

    listRecommendedMachineImages = async (): Promise<MachineImage[]> => {
        if (
            this.cachedMachineImages.length > 0 &&
            dayjs().utc().diff(this.cachedMachineImagesAt, 'minutes') < 10
        ) {
            console.log('Returning cached machine images');
            return this.cachedMachineImages;
        }

        const instanceParameterNames: string[] = [
            '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
            '/aws/service/ami-windows-latest/Windows_Server-2019-English-Full-Base',
            '/aws/service/ami-windows-latest/EC2LaunchV2-Windows_Server-2016-English-Full-Base',
            '/aws/service/ami-windows-latest/TPM-Windows_Server-2022-English-Full-Base',
        ];

        const machineImageIds = await Promise.all(
            instanceParameterNames.map((name) => this.deps.configVault.getParameter(name)),
        );
        const definedMachineImageIds = machineImageIds.filter(
            (id): id is string => id !== undefined,
        );

        const { Images } = await this.ec2Client.send(
            new DescribeImagesCommand({ ImageIds: definedMachineImageIds }),
        );

        const mappedMachineImages =
            Images?.map((image) => {
                const storageInGb =
                    image.BlockDeviceMappings?.map((i) => i.Ebs?.VolumeSize ?? 0)?.reduce(
                        (acc, curr) => acc + curr,
                        0,
                    ) ?? 0;

                return {
                    id: image.ImageId ?? '',
                    storageInGb,
                    platform: this.parseMachineImagePlatform(image),
                    distribution: image.Description ?? 'unknown',
                    state: this.mapMachineImageState(image.State),
                } satisfies MachineImage;
            }) ?? [];

        this.cachedMachineImages = mappedMachineImages;
        this.cachedMachineImagesAt = dayjs().utc().toDate();

        return mappedMachineImages;
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
            if (instanceTypes?.length === 0) return [];

            if (
                instanceTypes === undefined &&
                this.cachedInstanceTypes.length > 0 &&
                dayjs().utc().diff(this.cachedInstanceTypesAt, 'minutes') < 10
            ) {
                console.log('Returning cached instance types');
                return this.cachedInstanceTypes;
            }

            const results: InstanceTypeInfo[] = [];

            for await (const page of paginateDescribeInstanceTypes(
                { client: this.ec2Client },
                {
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
                },
            )) {
                results.push(...(page.InstanceTypes ?? []));
            }

            const mappedInstanceTypes = results.map((instanceType) =>
                this.mapInstanceType(instanceType),
            );

            if (instanceTypes === undefined) {
                this.cachedInstanceTypes = mappedInstanceTypes;
                this.cachedInstanceTypesAt = dayjs().utc().toDate();
            }

            return mappedInstanceTypes;
        } catch (error) {
            this.deps.logger.error('Failed to list instance types', { error });
            return [];
        }
    };

    scheduleInstanceOperation = async (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
        afterMinutes: number,
    ): Promise<void> => {
        await this.unscheduleInstanceOperation(virtualId, operation);

        await this.schedulerClient.send(
            new CreateScheduleCommand({
                Name: this.getScheduledOperationName(virtualId, operation),
                FlexibleTimeWindow: {
                    Mode: 'OFF',
                },
                ActionAfterCompletion: 'DELETE',
                ScheduleExpression: `at(${dayjs().utc().add(afterMinutes, 'minutes').format('YYYY-MM-DDTHH:mm:ss')})`,
                ScheduleExpressionTimezone: 'UTC',
                State: 'ENABLED',
                Description: `Scheduled ${operation} operation for virtual instance ${virtualId}`,
                Target: {
                    Arn: this.deps.EVENT_BUS_ARN,
                    RoleArn: this.deps.EVENT_BUS_PUBLISHER_ROLE_ARN,
                    EventBridgeParameters: {
                        DetailType: 'INSTANCE_IDLE',
                        Source: 'virtual-lab-core',
                    },
                    Input: JSON.stringify({ virtualId }),
                },
            }),
        );
    };

    unscheduleInstanceOperation = async (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
    ): Promise<void> => {
        try {
            await this.schedulerClient.send(
                new DeleteScheduleCommand({
                    Name: this.getScheduledOperationName(virtualId, operation),
                }),
            );
        } catch (error) {
            if (!(error instanceof ResourceNotFoundException)) {
                throw error;
            }
        }
    };
}
