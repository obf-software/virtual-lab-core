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

    constructor(props: { AWS_REGION: string }) {
        this.client = new EC2Client({ region: props.AWS_REGION });
    }

    async getInstance(awsInstanceId: string) {
        const command = new DescribeInstancesCommand({ InstanceIds: [awsInstanceId] });
        const { Reservations } = await this.client.send(command);
        const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
        if (instances.length === 0) return undefined;
        return instances[0];
    }

    async listInstanceStatuses(awsInstanceIds: string[]) {
        const command = new DescribeInstanceStatusCommand({
            InstanceIds: awsInstanceIds,
            IncludeAllInstances: true,
        });
        const { InstanceStatuses } = await this.client.send(command);
        return InstanceStatuses ?? [];
    }

    async getImageDescription(awsImageId: string) {
        const command = new DescribeImageAttributeCommand({
            Attribute: 'description',
            ImageId: awsImageId,
        });
        const { Description } = await this.client.send(command);
        return Description?.Value;
    }

    async getInstanceTypeData(awsInstanceType: string) {
        const command = new DescribeInstanceTypesCommand({ InstanceTypes: [awsInstanceType] });
        const { InstanceTypes } = await this.client.send(command);
        if (InstanceTypes === undefined || InstanceTypes.length === 0) return undefined;
        return InstanceTypes[0];
    }

    async getVolumeData(awsVolumeId: string) {
        const command = new DescribeVolumesCommand({ VolumeIds: [awsVolumeId] });
        const { Volumes } = await this.client.send(command);
        if (Volumes === undefined || Volumes.length === 0) return undefined;
        return Volumes[0];
    }

    async startInstance(awsInstanceId: string) {
        const command = new StartInstancesCommand({ InstanceIds: [awsInstanceId] });

        const { StartingInstances } = await this.client.send(command);
        if (StartingInstances === undefined || StartingInstances.length === 0) return undefined;
        return StartingInstances[0];
    }

    async stopInstance(awsInstanceId: string, force: boolean, hibernate: boolean) {
        const command = new StopInstancesCommand({
            InstanceIds: [awsInstanceId],
            Force: force,
            Hibernate: hibernate,
        });

        const { StoppingInstances } = await this.client.send(command);
        if (StoppingInstances === undefined || StoppingInstances.length === 0) return undefined;
        return StoppingInstances[0];
    }

    async rebootInstance(awsInstanceId: string) {
        const command = new RebootInstancesCommand({ InstanceIds: [awsInstanceId] });
        await this.client.send(command);
    }

    async terminateInstance(awsInstanceId: string) {
        const command = new TerminateInstancesCommand({ InstanceIds: [awsInstanceId] });
        const { TerminatingInstances } = await this.client.send(command);
        if (TerminatingInstances === undefined || TerminatingInstances.length === 0)
            return undefined;
        return TerminatingInstances[0];
    }
}
