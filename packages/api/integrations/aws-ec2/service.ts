import {
    DescribeImageAttributeCommand,
    DescribeInstanceStatusCommand,
    DescribeInstanceTypesCommand,
    DescribeInstancesCommand,
    DescribeVolumesCommand,
    EC2Client,
    RebootInstancesCommand,
    StartInstancesCommand,
    StopInstancesCommand,
    TerminateInstancesCommand,
} from '@aws-sdk/client-ec2';

export class AwsEc2Integration {
    private client: EC2Client;

    constructor(AWS_REGION: string) {
        this.client = new EC2Client({ region: AWS_REGION });
    }

    async getInstance(instanceId: string) {
        const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
        const { Reservations } = await this.client.send(command);
        const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
        if (instances.length === 0) return undefined;
        return instances[0];
    }

    async listInstanceStatuses(instanceIds: string[]) {
        const command = new DescribeInstanceStatusCommand({
            InstanceIds: instanceIds,
            IncludeAllInstances: true,
        });
        const { InstanceStatuses } = await this.client.send(command);
        return InstanceStatuses ?? [];
    }

    async getImageDescription(imageId: string) {
        const command = new DescribeImageAttributeCommand({
            Attribute: 'description',
            ImageId: imageId,
        });
        const { Description } = await this.client.send(command);
        return Description?.Value;
    }

    async getInstanceTypeData(instanceType: string) {
        const command = new DescribeInstanceTypesCommand({ InstanceTypes: [instanceType] });
        const { InstanceTypes } = await this.client.send(command);
        if (InstanceTypes === undefined || InstanceTypes.length === 0) return undefined;
        return InstanceTypes[0];
    }

    async getVolumeData(volumeId: string) {
        const command = new DescribeVolumesCommand({ VolumeIds: [volumeId] });
        const { Volumes } = await this.client.send(command);
        if (Volumes === undefined || Volumes.length === 0) return undefined;
        return Volumes[0];
    }

    async startInstance(instanceId: string) {
        const command = new StartInstancesCommand({ InstanceIds: [instanceId] });

        const { StartingInstances } = await this.client.send(command);
        if (StartingInstances === undefined || StartingInstances.length === 0) return undefined;
        return StartingInstances[0];
    }

    async stopInstance(instanceId: string, force: boolean, hibernate: boolean) {
        const command = new StopInstancesCommand({
            InstanceIds: [instanceId],
            Force: force,
            Hibernate: hibernate,
        });

        const { StoppingInstances } = await this.client.send(command);
        if (StoppingInstances === undefined || StoppingInstances.length === 0) return undefined;
        return StoppingInstances[0];
    }

    async rebootInstance(instanceId: string) {
        const command = new RebootInstancesCommand({ InstanceIds: [instanceId] });
        await this.client.send(command);
    }

    async terminateInstance(instanceId: string) {
        const command = new TerminateInstancesCommand({ InstanceIds: [instanceId] });
        const { TerminatingInstances } = await this.client.send(command);
        if (TerminatingInstances === undefined || TerminatingInstances.length === 0)
            return undefined;
        return TerminatingInstances[0];
    }
}
