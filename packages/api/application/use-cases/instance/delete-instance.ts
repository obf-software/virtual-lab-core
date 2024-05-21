import { z } from 'zod';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const deleteInstanceInputSchema = z
    .object({
        principal: principalSchema,
        instanceId: z.string().min(1),
    })
    .strict();
export type DeleteInstanceInput = z.infer<typeof deleteInstanceInputSchema>;

export type DeleteInstanceOutput = void;

export class DeleteInstance {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(deleteInstanceInputSchema)
    async execute(input: DeleteInstanceInput): Promise<DeleteInstanceOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');
        const { id } = this.auth.getClaims(input.principal);

        const instance = await this.instanceRepository.getById(input.instanceId);

        if (instance === undefined) {
            throw Errors.resourceNotFound('Instance', input.instanceId);
        }

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && !instance.isOwnedBy(id)) {
            throw Errors.resourceAccessDenied('Instance', input.instanceId);
        }

        await Promise.allSettled([
            this.instanceRepository.delete(instance),
            this.virtualizationGateway.terminateInstance(instance.getData().launchToken),
        ]);
    }
}
