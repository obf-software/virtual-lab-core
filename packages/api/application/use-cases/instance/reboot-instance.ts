import { z } from 'zod';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';

export const rebootInstanceInputSchema = z
    .object({
        principal: principalSchema,
        instanceId: z.string().nonempty(),
    })
    .strict();
export type RebootInstanceInput = z.infer<typeof rebootInstanceInputSchema>;

export type RebootInstanceOutput = void;

export class RebootInstance {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: RebootInstanceInput): Promise<RebootInstanceOutput> => {
        this.logger.debug('RebootInstance.execute', { input });

        const inputValidation = rebootInstanceInputSchema.safeParse(input);
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

        const { virtualId } = instance.getData();

        if (!instance.hasBeenLaunched() || virtualId === undefined) {
            throw Errors.businessRuleViolation('Instance was not launched yet');
        }

        const instanceSummary = await this.virtualizationGateway.getInstanceSummary(virtualId);
        instance.onStateRetrieved(instanceSummary.state);

        if (!instance.isReadyToReboot()) {
            throw Errors.businessRuleViolation('Instance is not ready to turn on');
        }

        await this.virtualizationGateway.rebootInstance(virtualId);
    };
}
