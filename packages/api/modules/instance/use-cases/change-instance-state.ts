import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { EC2 } from '../../../infrastructure/aws/ec2';
import { InstanceRepository } from '../../../infrastructure/repositories';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import { Logger } from '@aws-lambda-powertools/logger';

export class ChangeInstanceStateUseCase implements IUseCase {
    constructor(
        private readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly ec2: EC2,
    ) {}

    execute = async (props: {
        principal: Principal;
        instanceId: number;
        state: 'start' | 'stop' | 'reboot';
    }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        if (Number.isNaN(props.instanceId)) {
            throw new createHttpError.NotFound('Instance not found');
        }

        const instance = await this.instanceRepository.getById(props.instanceId);

        if (!instance) {
            throw new createHttpError.NotFound('Instance not found');
        }

        if (
            !hasRoleOrAbove('ADMIN', props.principal.role) &&
            props.principal.userId !== instance?.userId
        ) {
            throw new createHttpError.Forbidden('You are not authorized to perform this action');
        }

        if (!instance.awsInstanceId) {
            throw new createHttpError.BadRequest('Instance is not launched yet');
        }

        if (props.state === 'start') {
            const output = await this.ec2.startInstance(instance.awsInstanceId);
            this.logger.info(`Instance ${instance.awsInstanceId} started`, { output });
        } else if (props.state === 'reboot') {
            await this.ec2.rebootInstance(instance.awsInstanceId);
            this.logger.info(`Instance ${instance.awsInstanceId} rebooted`);
        } else if (props.state === 'stop') {
            const output = await this.ec2.stopInstance(instance.awsInstanceId, false, false);
            this.logger.info(`Instance ${instance.awsInstanceId} stopped`, { output });
        } else {
            throw new createHttpError.BadRequest('Invalid state');
        }
    };
}
