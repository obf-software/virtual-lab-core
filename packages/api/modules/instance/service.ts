import { AwsEc2Integration } from '../../integrations/aws-ec2/service';
import { InstanceRepository } from './repository';

export class InstanceService {
    private instanceRepository: InstanceRepository;
    private awsEc2Integration: AwsEc2Integration;

    constructor(instanceRepository: InstanceRepository, awsEc2Integration: AwsEc2Integration) {
        this.instanceRepository = instanceRepository;
        this.awsEc2Integration = awsEc2Integration;
    }

    async getInstanceByAwsInstanceId(awsInstanceId: string) {
        return await this.instanceRepository.getInstanceByAwsInstanceId(awsInstanceId);
    }

    async getInstanceById(instanceId: number) {
        return await this.instanceRepository.getInstanceById(instanceId);
    }

    async listUserInstances(
        userId: number,
        pagination: {
            resultsPerPage: number;
            page: number;
        },
    ) {
        const instances = await this.instanceRepository.listUserInstances(userId, pagination);
        if (instances.data.length === 0) {
            return instances;
        }

        const awsInstanceIds = instances.data.map((i) => i.awsInstanceId);
        const instanceStatuses = await this.awsEc2Integration.listInstanceStatuses(awsInstanceIds);
        const instanceStatesByInstanceId = instanceStatuses.reduce(
            (acc, curr) => {
                if (curr.InstanceId !== undefined) {
                    acc[curr.InstanceId] = curr.InstanceState?.Name;
                }
                return acc;
            },
            {} as Record<string, string | undefined>,
        );
        const instancesWithStates = instances.data.map((i) => ({
            ...i,
            state: instanceStatesByInstanceId[i.awsInstanceId],
        }));

        return {
            ...instances,
            data: instancesWithStates,
        };
    }

    async changeInstanceState(
        awsInstanceId: string,
        state: 'start' | 'stop' | 'reboot' | 'terminate',
    ) {
        switch (state) {
            case 'start':
                return await this.awsEc2Integration.startInstance(awsInstanceId);
            case 'stop':
                return await this.awsEc2Integration.stopInstance(awsInstanceId, false, false);
            case 'reboot':
                await this.awsEc2Integration.rebootInstance(awsInstanceId);
                return undefined;
            case 'terminate':
                return await this.awsEc2Integration.terminateInstance(awsInstanceId);
        }
    }
}
