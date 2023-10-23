// import {
//     DescribeImagesCommand,
//     DescribeInstanceStatusCommand,
//     DescribeInstanceTypesCommand,
//     DescribeInstancesCommand,
//     DescribeVolumesCommand,
//     EC2Client,
//     RebootInstancesCommand,
//     StartInstancesCommand,
//     StopInstancesCommand,
// } from '@aws-sdk/client-ec2';

// export class EC2 {
//     private client: EC2Client;

//     constructor(AWS_REGION: string) {
//         this.client = new EC2Client({ region: AWS_REGION });
//     }

//     async getInstance(awsInstanceId: string) {
//         const command = new DescribeInstancesCommand({ InstanceIds: [awsInstanceId] });
//         const { Reservations } = await this.client.send(command);
//         const instances = Reservations?.map((r) => r.Instances ?? []).flat() ?? [];
//         if (instances.length === 0) return undefined;
//         return instances[0];
//     }

//     async listInstanceStatuses(awsInstanceIds: string[]) {
//         const command = new DescribeInstanceStatusCommand({
//             InstanceIds: awsInstanceIds,
//             IncludeAllInstances: true,
//         });
//         const { InstanceStatuses } = await this.client.send(command);
//         return InstanceStatuses ?? [];
//     }

//     async getImageDescription(awsImageId: string) {
//         const command = new DescribeImagesCommand({
//             ImageIds: [awsImageId],
//         });
//         const { Images } = await this.client.send(command);
//         if (Images === undefined || Images.length === 0) return undefined;
//         return Images[0].Description;
//     }

//     async getInstanceTypeData(awsInstanceType: string) {
//         const command = new DescribeInstanceTypesCommand({ InstanceTypes: [awsInstanceType] });
//         const { InstanceTypes } = await this.client.send(command);
//         if (InstanceTypes === undefined || InstanceTypes.length === 0) return undefined;
//         return InstanceTypes[0];
//     }

//     async getVolumesTotalSize(awsVolumeIds: string[]) {
//         const command = new DescribeVolumesCommand({ VolumeIds: awsVolumeIds });
//         const { Volumes } = await this.client.send(command);
//         return Volumes?.map((v) => v.Size ?? 0).reduce((acc, curr) => acc + curr, 0);
//     }

//     async startInstance(awsInstanceId: string) {
//         const command = new StartInstancesCommand({ InstanceIds: [awsInstanceId] });

//         const { StartingInstances } = await this.client.send(command);
//         if (StartingInstances === undefined || StartingInstances.length === 0) return undefined;
//         return StartingInstances[0];
//     }

//     async stopInstance(awsInstanceId: string, force: boolean, hibernate: boolean) {
//         const command = new StopInstancesCommand({
//             InstanceIds: [awsInstanceId],
//             Force: force,
//             Hibernate: hibernate,
//         });

//         const { StoppingInstances } = await this.client.send(command);
//         if (StoppingInstances === undefined || StoppingInstances.length === 0) return undefined;
//         return StoppingInstances[0];
//     }

//     async rebootInstance(awsInstanceId: string) {
//         const command = new RebootInstancesCommand({ InstanceIds: [awsInstanceId] });
//         await this.client.send(command);
//     }
// }
