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
import {
    VirtualInstanceDetailedInfo,
    VirtualInstanceState,
    VirtualInstanceSummary,
    VirtualizationGateway,
} from '../application/virtualization-gateway';
import createHttpError from 'http-errors';

export class AwsVirtualizationGateway implements VirtualizationGateway {
    private ec2Client: EC2Client;

    constructor(AWS_REGION: string) {
        this.ec2Client = new EC2Client({ region: AWS_REGION });
    }

    private mapInstanceState = (stateName?: string): VirtualInstanceState => {
        const stateMap: Record<string, keyof typeof VirtualInstanceState> = {
            pending: VirtualInstanceState.PENDING,
            running: VirtualInstanceState.RUNNING,
            'shutting-down': VirtualInstanceState.SHUTTING_DOWN,
            stopped: VirtualInstanceState.STOPPED,
            stopping: VirtualInstanceState.STOPPING,
            terminated: VirtualInstanceState.TERMINATED,
        };

        const state = stateMap[stateName?.toLowerCase() ?? ''];

        if (state === undefined) {
            throw new createHttpError.InternalServerError('Instance state not found');
        }

        return VirtualInstanceState[state];
    };

    getInstanceSummaryById = async (instanceId: string): Promise<VirtualInstanceSummary> => {
        const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
        const { Reservations } = await this.ec2Client.send(command);
        const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
        if (instances.length === 0) throw new createHttpError.NotFound('Instance not found');
        return {
            hostname: instances[0].PublicDnsName ?? '',
            id: instances[0].InstanceId ?? '',
            state: this.mapInstanceState(instances[0].State?.Name),
        };
    };

    getInstanceDetailedInfoById = async (
        instanceId: string,
    ): Promise<VirtualInstanceDetailedInfo> => {
        const { Reservations } = await this.ec2Client.send(
            new DescribeInstancesCommand({ InstanceIds: [instanceId] }),
        );
        const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
        if (instances.length === 0) throw new createHttpError.NotFound('Instance not found');
        const instance = instances[0];

        const [{ InstanceTypes }, { Images }, { Volumes }] = await Promise.all([
            this.ec2Client.send(
                new DescribeInstanceTypesCommand({ InstanceTypes: [instance.InstanceType ?? ''] }),
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
            id: instance.InstanceId ?? '',
            state: this.mapInstanceState(instance.State?.Name),
            cpuCores: instance.CpuOptions?.CoreCount?.toString() ?? '0',
            platform: instance.PlatformDetails ?? 'unknown',
            instanceType: instance.InstanceType ?? 'unknown',
            distribution: Images?.[0]?.Description ?? 'unknown',
            memoryInGb: memoryInMib !== 0 ? `${memoryInMib / 1024}` : '0',
            storageInGb: `${storageInGb}`,
        };
    };

    listInstanceStates = async (
        instanceIds: string[],
    ): Promise<Record<string, VirtualInstanceState>> => {
        const command = new DescribeInstanceStatusCommand({
            IncludeAllInstances: true,
            InstanceIds: instanceIds,
        });
        const { InstanceStatuses } = await this.ec2Client.send(command);
        const instanceStates: Record<string, VirtualInstanceState> = {};
        InstanceStatuses?.forEach((instanceStatus) => {
            instanceStates[instanceStatus.InstanceId ?? ''] = this.mapInstanceState(
                instanceStatus.InstanceState?.Name,
            );
        });
        return instanceStates;
    };

    getInstanceState = async (instanceId: string): Promise<VirtualInstanceState> => {
        const command = new DescribeInstanceStatusCommand({
            IncludeAllInstances: true,
            InstanceIds: [instanceId],
        });
        const { InstanceStatuses } = await this.ec2Client.send(command);
        return this.mapInstanceState(InstanceStatuses?.[0].InstanceState?.Name);
    };

    startInstance = async (instanceId: string): Promise<void> => {
        const command = new StartInstancesCommand({ InstanceIds: [instanceId] });
        await this.ec2Client.send(command);
    };

    stopInstance = async (
        instanceId: string,
        hibernate: boolean,
        force: boolean,
    ): Promise<void> => {
        const command = new StopInstancesCommand({
            InstanceIds: [instanceId],
            Hibernate: hibernate,
            Force: force,
        });
        await this.ec2Client.send(command);
    };

    rebootInstance = async (instanceId: string): Promise<void> => {
        const command = new RebootInstancesCommand({ InstanceIds: [instanceId] });
        await this.ec2Client.send(command);
    };
}
