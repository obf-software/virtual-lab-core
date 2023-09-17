import { AwsEc2Integration } from '../../integrations/aws-ec2/service';
import { InstanceRepository } from './repository';

export class InstanceService {
    private instanceRepository: InstanceRepository;
    private awsEc2Integration: AwsEc2Integration;

    constructor(instanceRepository: InstanceRepository, awsEc2Integration: AwsEc2Integration) {
        this.instanceRepository = instanceRepository;
        this.awsEc2Integration = awsEc2Integration;
    }

    async listUserInstances(
        userId: number,
        pagination: {
            resultsPerPage: number;
            page: number;
        },
    ) {
        const instances = await this.instanceRepository.listUserInstances(userId, pagination);
        const awsInstanceIds = instances.data.map((i) => i.awsInstanceId);

        const instanceStatuses = await this.awsEc2Integration.getInstanceStatuses(awsInstanceIds);
        const instanceStatusesByInstanceId = instanceStatuses.reduce(
            (acc, curr) => {
                if (curr.InstanceId !== undefined) {
                    acc[curr.InstanceId] = curr.InstanceState?.Name;
                }
                return acc;
            },
            {} as Record<string, string | undefined>,
        );

        const instancesWithStatuses = instances.data.map((i) => ({
            ...i,
            status: instanceStatusesByInstanceId[i.awsInstanceId],
        }));

        return {
            ...instances,
            data: instancesWithStatuses,
        };
    }
}
