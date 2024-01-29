import { z } from 'zod';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceState } from '../../../domain/dtos/instance-state';

export const turnInstanceOffInputSchema = z
    .object({
        principal: principalSchema,
        instanceId: z.string().nonempty(),
    })
    .strict();
export type TurnInstanceOffInput = z.infer<typeof turnInstanceOffInputSchema>;

export interface TurnInstanceOffOutput {
    state: InstanceState;
}

export class TurnInstanceOff {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: TurnInstanceOffInput): Promise<TurnInstanceOffOutput> => {
        this.logger.debug('TurnInstanceOff.execute', { input });

        const inputValidation = turnInstanceOffInputSchema.safeParse(input);
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

        if (!instance.isReadyToTurnOff()) {
            throw Errors.businessRuleViolation('Instance is not ready to turn off');
        }

        const state = await this.virtualizationGateway.stopInstance(
            virtualId,
            false, // @todo try getting from instance data if the instance has support to it
            false,
        );

        return { state };
    };
}
