import { Principal } from '../../../domain/dtos/principal';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { InstanceRepository } from '../../repositories/instance-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';

export interface TurnInstanceOffInput {
    principal: Principal;
    instanceId: number;
}

export type TurnInstanceOffOutput = void;

export class TurnInstanceOff {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: TurnInstanceOffInput): Promise<TurnInstanceOffOutput> => {
        this.logger.debug('TurnInstanceOff.execute', { input });

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

        if (!instance.isReadyToTurnOff()) {
            throw ApplicationError.businessRuleViolation('Instance is not ready to turn off');
        }

        await this.virtualizationGateway.stopInstance(logicalId, false, false);
    };

    // execute = async (props: {
    //     principal: Principal;
    //     instanceId: number;
    //     state: 'start' | 'stop' | 'reboot';
    // }) => {
    //     throwIfInsufficientRole('USER', props.principal.role);

    //     if (Number.isNaN(props.instanceId)) {
    //         throw new createHttpError.NotFound('Instance not found');
    //     }

    //     const instance = await this.instanceRepository.getById(props.instanceId);

    //     if (!instance) {
    //         throw new createHttpError.NotFound('Instance not found');
    //     }

    //     if (
    //         !hasRoleOrAbove('ADMIN', props.principal.role) &&
    //         props.principal.userId !== instance?.userId
    //     ) {
    //         throw new createHttpError.Forbidden('You are not authorized to perform this action');
    //     }

    //     if (!instance.awsInstanceId) {
    //         throw new createHttpError.BadRequest('Instance is not launched yet');
    //     }

    //     if (props.state === 'start') {
    //         const output = await this.ec2.startInstance(instance.awsInstanceId);
    //         this.logger.info(`Instance ${instance.awsInstanceId} started`, { output });
    //     } else if (props.state === 'reboot') {
    //         await this.ec2.rebootInstance(instance.awsInstanceId);
    //         this.logger.info(`Instance ${instance.awsInstanceId} rebooted`);
    //     } else if (props.state === 'stop') {
    //         const output = await this.ec2.stopInstance(instance.awsInstanceId, false, false);
    //         this.logger.info(`Instance ${instance.awsInstanceId} stopped`, { output });
    //     } else {
    //         throw new createHttpError.BadRequest('Invalid state');
    //     }
    // };
}
