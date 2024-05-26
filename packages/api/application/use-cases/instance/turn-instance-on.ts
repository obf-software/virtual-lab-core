import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceState } from '../../../domain/dtos/instance-state';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const turnInstanceOnInput = z
    .object({
        principal: principalSchema,
        instanceId: z.string().min(1),
    })
    .strict();
export type TurnInstanceOnInput = z.infer<typeof turnInstanceOnInput>;

export interface TurnInstanceOnOutput {
    state: InstanceState;
}

export class TurnInstanceOn {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(turnInstanceOnInput)
    async execute(input: TurnInstanceOnInput): Promise<TurnInstanceOnOutput> {
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
            throw Errors.internalError('Virtual instance not found');
        }

        instance.onStateRetrieved(virtualInstance.state);

        if (!instance.isReadyToTurnOn()) {
            throw Errors.businessRuleViolation('Instance is not ready to turn on');
        }

        const state = await this.virtualizationGateway.startInstance(virtualId);
        return { state };
    }
}
