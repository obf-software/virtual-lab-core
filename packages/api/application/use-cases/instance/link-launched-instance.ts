import { InstanceLaunched } from '../../../domain/application-events/instance-launched';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';
import { Errors } from '../../../domain/dtos/errors';
import { EventPublisher } from '../../event-publisher';
import { InstanceRepository } from '../../instance-repository';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { z } from 'zod';

export const linkLaunchedInstanceInputSchema = z.object({
    stackName: z.string().min(1),
});
export type LinkLaunchedInstanceInput = z.infer<typeof linkLaunchedInstanceInputSchema>;

export type LinkLaunchedInstanceOutput = void;

export class LinkLaunchedInstance {
    constructor(
        readonly logger: Logger,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
        private readonly eventPublisher: EventPublisher,
    ) {}

    @useCaseExecute(linkLaunchedInstanceInputSchema)
    async execute(input: LinkLaunchedInstanceInput): Promise<LinkLaunchedInstanceOutput> {
        const instanceStack = await this.virtualizationGateway.getInstanceStack(input.stackName);

        const [virtualInstance, instance] = await Promise.all([
            this.virtualizationGateway.getInstance(instanceStack.virtualId),
            this.instanceRepository.getByLaunchToken(instanceStack.launchToken),
        ]);

        if (!virtualInstance) {
            throw Errors.resourceNotFound('VirtualInstance', instanceStack.virtualId);
        }

        if (!instance) {
            throw Errors.resourceNotFound('Instance', instanceStack.launchToken);
        }

        instance.update({
            virtualId: virtualInstance.virtualId,
            connectionType: instanceStack.connectionType,
        });

        const [user] = await Promise.all([
            this.userRepository.getById(instance.getData().ownerId),
            this.instanceRepository.update(instance),
        ]);

        if (!user) {
            throw Errors.resourceNotFound('User', instance.getData().ownerId);
        }

        await this.eventPublisher.publish(
            new InstanceLaunched({
                username: user.getData().username,
                instance: instance.getData(),
                state: virtualInstance.state,
            }),
        );
    }
}
