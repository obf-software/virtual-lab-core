import { z } from 'zod';
import { Logger } from '../../logger';
import { instanceStateSchema } from '../../../domain/dtos/instance-state';
import { InstanceRepository } from '../../instance-repository';
import { UserRepository } from '../../user-repository';
import { EventPublisher } from '../../event-publisher';
import { InstanceStateChanged } from '../../../domain/application-events/instance-state-changed';
import { ApplicationEvent } from '../../../domain/dtos/application-event';
import { InstanceConnectionEnded } from '../../../domain/application-events/instance-connection-ended';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const notifyInstanceStateChangeInputSchema = z
    .object({
        virtualId: z.string().min(1),
        state: instanceStateSchema,
    })
    .strict();
export type NotifyInstanceStateChangeInput = z.infer<typeof notifyInstanceStateChangeInputSchema>;

export type NotifyInstanceStateChangeOutput = void;

export class NotifyInstanceStateChange {
    constructor(
        readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly userRepository: UserRepository,
        private readonly eventPublisher: EventPublisher,
    ) {}

    @useCaseExecute(notifyInstanceStateChangeInputSchema)
    async execute(input: NotifyInstanceStateChangeInput): Promise<NotifyInstanceStateChangeOutput> {
        const instance = await this.instanceRepository.getByVirtualId(input.virtualId);

        if (!instance) {
            this.logger.info(`Instance not found, skipping instance state change notification`, {
                virtualId: input.virtualId,
            });
            return;
        }

        const user = await this.userRepository.getById(instance.getData().ownerId);

        if (!user) {
            this.logger.warn(`User not found, skipping instance state change notification`, {
                ownerId: instance.getData().ownerId,
            });
            return;
        }

        const eventsToPublish: ApplicationEvent[] = [
            new InstanceStateChanged({
                username: user.getData().username,
                instance: instance.getData(),
                state: input.state,
            }),
        ];

        const virtualId = instance.getData().virtualId;
        if (input.state === 'RUNNING' && virtualId) {
            /**
             * This is a way to ensure that the instance will be automatically stopped after
             * a certain time if the user does not connect to it.
             */
            eventsToPublish.push(
                new InstanceConnectionEnded({
                    username: user.getData().username,
                    virtualId,
                }),
            );
        }

        await this.eventPublisher.publish(...eventsToPublish);
    }
}
