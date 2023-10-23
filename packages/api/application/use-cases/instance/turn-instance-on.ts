import { Principal } from '../../../domain/dtos/principal';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { InstanceRepository } from '../../repositories/instance-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';

export interface TurnInstanceOnInput {
    principal: Principal;
    instanceId: number;
}

export type TurnInstanceOnOutput = void;

export class TurnInstanceOn {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: TurnInstanceOnInput): Promise<TurnInstanceOnOutput> => {
        this.logger.debug('TurnInstanceOn.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'USER',
            AuthError.insufficientRole('USER'),
        );

        const principalId = this.auth.getId(input.principal);
        const instance = await this.instanceRepository.getById(input.instanceId);
        if (instance === undefined) throw ApplicationError.resourceNotFound();

        if (
            !this.auth.hasRoleOrAbove(input.principal, 'ADMIN') &&
            instance.getData().userId !== principalId
        ) {
            throw AuthError.insufficientRole('ADMIN');
        }

        const { logicalId } = instance.getData();

        if (logicalId === null) {
            throw ApplicationError.businessRuleViolation('Instance was not provisioned yet');
        }

        const virtualInstance = await this.virtualizationGateway.getInstanceSummaryById(logicalId);
        instance.setState(virtualInstance.state);

        if (!instance.isReadyToTurnOn()) {
            throw ApplicationError.businessRuleViolation('Instance is not ready to turn on');
        }

        await this.virtualizationGateway.startInstance(logicalId);
    };
}
