import { InstanceStateChangedNotification } from '../../../domain/notifications/instance-state-changed-notification';
import { Logger } from '../../logger';
import { NotificationPublisher } from '../../notification-publisher';
import { InstanceRepository } from '../../repositories/instance-repository';
import { UserRepository } from '../../repositories/user-repository';
import { VirtualInstanceState } from '../../virtualization-gateway';

export interface NotifyInstanceStateChangeInput {
    instanceLogicalId: string;
    state: VirtualInstanceState;
}

export type NotifyInstanceStateChangeOutput = void;

export class NotifyInstanceStateChange {
    constructor(
        private readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly userRepository: UserRepository,
        private readonly notificationPublisher: NotificationPublisher,
    ) {}

    execute = async (
        input: NotifyInstanceStateChangeInput,
    ): Promise<NotifyInstanceStateChangeOutput> => {
        this.logger.debug('NotifyInstanceStateChange.execute', { input });

        const instance = await this.instanceRepository.getByLogicalId(input.instanceLogicalId);

        if (!instance) {
            this.logger.info(
                `Instance ${input.instanceLogicalId} not found, skipping instance state change notification`,
            );
            return;
        }

        const user = await this.userRepository.getById(instance.getData().userId);

        if (!user) {
            this.logger.error(
                `User ${
                    instance.getData().userId
                } not found, skipping instance state change notification`,
            );
            return;
        }

        const notification = new InstanceStateChangedNotification(
            user.getData().username,
            instance,
            input.state,
        );

        await this.notificationPublisher.publish(notification);
    };
}
