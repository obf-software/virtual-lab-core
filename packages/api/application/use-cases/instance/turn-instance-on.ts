import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceState } from '../../../domain/dtos/instance-state';

export const turnInstanceOnInput = z
    .object({
        principal: principalSchema,
        instanceId: z.string().nonempty(),
    })
    .strict();
export type TurnInstanceOnInput = z.infer<typeof turnInstanceOnInput>;

export interface TurnInstanceOnOutput {
    state: InstanceState;
}

export class TurnInstanceOn {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: TurnInstanceOnInput): Promise<TurnInstanceOnOutput> => {
        this.logger.debug('TurnInstanceOn.execute', { input });

        const inputValidation = turnInstanceOnInput.safeParse(input);
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

        if (!instance.isReadyToTurnOn()) {
            throw Errors.businessRuleViolation('Instance is not ready to turn on');
        }

        const state = await this.virtualizationGateway.startInstance(virtualId);
        return { state };
    };
}
