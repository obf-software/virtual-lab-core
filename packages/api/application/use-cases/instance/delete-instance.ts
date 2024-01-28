import { z } from 'zod';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { VirtualizationGateway } from '../../virtualization-gateway';

export const deleteInstanceInputSchema = z
    .object({
        principal: principalSchema,
        instanceId: z.string(),
    })
    .strict();
export type DeleteInstanceInput = z.infer<typeof deleteInstanceInputSchema>;

export type DeleteInstanceOutput = void;

export class DeleteInstance {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: DeleteInstanceInput): Promise<DeleteInstanceOutput> => {
        this.logger.debug('DeleteInstance.execute', { input });

        const inputValidation = deleteInstanceInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');
        const { id } = this.auth.getClaims(validInput.principal);

        const instance = await this.instanceRepository.getById(validInput.instanceId);
        if (instance === undefined)
            throw Errors.resourceNotFound('Instance', validInput.instanceId);

        if (!this.auth.hasRoleOrAbove(validInput.principal, 'ADMIN') && !instance.isOwnedBy(id)) {
            throw Errors.resourceAccessDenied('Instance', validInput.instanceId);
        }

        await Promise.allSettled([
            this.instanceRepository.delete(instance),
            this.virtualizationGateway.terminateInstance(instance.getData().launchToken),
        ]);
    };
}
