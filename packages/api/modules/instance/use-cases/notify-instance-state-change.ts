import { Logger } from '@aws-lambda-powertools/logger';
import { IUseCase } from '../../../domain/interfaces';
import { InstanceRepository, UserRepository } from '../../../infrastructure/repositories';
import { AppSync } from '../../../infrastructure/aws/app-sync';

export class NotifyInstanceStateChangeUseCase implements IUseCase {
    constructor(
        private readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly userRepository: UserRepository,
        private readonly appSync: AppSync,
    ) {}

    execute = async (props: { awsInstanceId: string; state: string }) => {
        const instance = await this.instanceRepository.getByAwsInstanceId(props.awsInstanceId);

        if (!instance) {
            this.logger.info(
                `Instance ${props.awsInstanceId} not found, skipping instance state change notification`,
            );
            return;
        }

        const user = await this.userRepository.getById(instance.userId);

        if (!user) {
            this.logger.error(
                `User ${instance.userId} not found, skipping instance state change notification`,
            );
            return;
        }

        await this.appSync.publishMutation(user.username, {
            type: 'EC2_INSTANCE_STATE_CHANGED',
            id: instance.id,
            awsInstanceId: instance.awsInstanceId,
            name: instance.name,
            state: props.state,
        });
    };
}
