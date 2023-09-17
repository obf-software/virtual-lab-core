import {
    DescribeImageAttributeCommand,
    DescribeInstanceStatusCommand,
    DescribeInstanceTypesCommand,
    DescribeInstancesCommand,
    DescribeVolumesCommand,
    EC2Client,
} from '@aws-sdk/client-ec2';

const { AWS_REGION } = process.env;

export class AwsEc2Integration {
    private client: EC2Client;

    constructor() {
        this.client = new EC2Client({ region: AWS_REGION });
    }

    async getInstance(instanceId: string) {
        const command = new DescribeInstancesCommand({ InstanceIds: [instanceId] });
        const { Reservations } = await this.client.send(command);
        const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
        if (instances.length === 0) return undefined;
        return instances[0];
    }

    async getInstanceStatuses(instanceIds: string[]) {
        const command = new DescribeInstanceStatusCommand({ InstanceIds: instanceIds });
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
}
