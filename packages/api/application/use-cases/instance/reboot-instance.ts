import { z } from 'zod';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const rebootInstanceInputSchema = z
    .object({
        principal: principalSchema,
        instanceId: z.string().min(1),
    })
    .strict();
export type RebootInstanceInput = z.infer<typeof rebootInstanceInputSchema>;

export type RebootInstanceOutput = void;

export class RebootInstance {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(rebootInstanceInputSchema)
    async execute(input: RebootInstanceInput): Promise<RebootInstanceOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');
        const { id } = this.auth.getClaims(input.principal);

        const instance = await this.instanceRepository.getById(input.instanceId);

        if (!instance) {
            throw Errors.resourceNotFound('Instance', input.instanceId);
        }

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && !instance.isOwnedBy(id)) {
            throw Errors.resourceAccessDenied('Instance', input.instanceId);
        }

        const { virtualId } = instance.getData();

        if (!instance.hasBeenLaunched() || virtualId === undefined) {
            throw Errors.businessRuleViolation('Instance was not launched yet');
        }

        const virtualInstance = await this.virtualizationGateway.getInstance(virtualId);

        if (!virtualInstance) {
            throw Errors.resourceNotFound('VirtualInstance', virtualId);
        }

        instance.onStateRetrieved(virtualInstance.state);

        if (!instance.isReadyToReboot()) {
            throw Errors.businessRuleViolation('Instance is not ready to turn on');
        }

        await this.virtualizationGateway.rebootInstance(virtualId);
    }
}
