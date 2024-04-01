import { z } from 'zod';
import { Logger } from '../../logger';
import { instanceStateSchema } from '../../../domain/dtos/instance-state';
import { InstanceRepository } from '../../instance-repository';
import { UserRepository } from '../../user-repository';
import { EventPublisher } from '../../event-publisher';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceStateChanged } from '../../../domain/application-events/instance-state-changed';
import { ApplicationEvent } from '../../../domain/dtos/application-event';
import { InstanceConnectionEnded } from '../../../domain/application-events/instance-connection-ended';

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
        private readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly userRepository: UserRepository,
        private readonly eventPublisher: EventPublisher,
    ) {}

    execute = async (
        input: NotifyInstanceStateChangeInput,
    ): Promise<NotifyInstanceStateChangeOutput> => {
        this.logger.debug('NotifyInstanceStateChange.execute', { input });

        const inputValidation = notifyInstanceStateChangeInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        const instance = await this.instanceRepository.getByVirtualId(validInput.virtualId);

        if (!instance) {
            this.logger.info(`Instance not found, skipping instance state change notification`, {
                virtualId: validInput.virtualId,
            });
            return;
        }

        const user = await this.userRepository.getById(instance.getData().ownerId);

        if (!user) {
            this.logger.error(`User not found, skipping instance state change notification`, {
                ownerId: instance.getData().ownerId,
            });
            return;
        }

        const eventsToPublish: ApplicationEvent[] = [
            new InstanceStateChanged({
                username: user.getData().username,
                instance: instance.getData(),
                state: validInput.state,
            }),
        ];

        const virtualId = instance.getData().virtualId;
        if (validInput.state === 'RUNNING' && virtualId) {
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
    };
}
