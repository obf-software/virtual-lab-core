import { InstanceLaunched } from '../../../domain/application-events/instance-launched';
import { Errors } from '../../../domain/dtos/errors';
import { EventPublisher } from '../../event-publisher';
import { InstanceRepository } from '../../instance-repository';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { z } from 'zod';

export const linkLaunchedInstanceInputSchema = z.object({
    stackName: z.string().nonempty(),
});
export type LinkLaunchedInstanceInput = z.infer<typeof linkLaunchedInstanceInputSchema>;

export type LinkLaunchedInstanceOutput = void;

export class LinkLaunchedInstance {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
        private readonly eventPublisher: EventPublisher,
    ) {}

    execute = async (input: LinkLaunchedInstanceInput): Promise<LinkLaunchedInstanceOutput> => {
        this.logger.debug('LinkLaunchedInstance.execute', { input });

        const inputValidation = linkLaunchedInstanceInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        const instanceStack = await this.virtualizationGateway.getInstanceStack(
            validInput.stackName,
        );

        const [instanceDetailedInfo, instance] = await Promise.all([
            this.virtualizationGateway.getInstanceDetailedInfo(instanceStack.virtualId),
            this.instanceRepository.getByLaunchToken(instanceStack.launchToken),
        ]);
        if (!instance) throw Errors.resourceNotFound('Instance', instanceStack.launchToken);

        instance.update({
            virtualId: instanceDetailedInfo.virtualId,
            connectionType: instanceStack.connectionType,
            platform: instanceDetailedInfo.platform,
            distribution: instanceDetailedInfo.distribution,
            instanceType: instanceDetailedInfo.instanceType,
            cpuCores: instanceDetailedInfo.cpuCores,
            memoryInGb: instanceDetailedInfo.memoryInGb,
            storageInGb: instanceDetailedInfo.storageInGb,
        });

        const [user] = await Promise.all([
            this.userRepository.getById(instance.getData().ownerId),
            this.instanceRepository.update(instance),
        ]);
        if (!user) throw Errors.resourceNotFound('User', instance.getData().ownerId);

        await this.eventPublisher.publish(
            new InstanceLaunched({
                username: user.getData().username,
                instance: instance.getData(),
                state: instanceDetailedInfo.state,
            }),
        );
    };
}
