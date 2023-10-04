import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { EC2 } from '../../../infrastructure/aws/ec2';
import { Guacamole } from '../../../infrastructure/guacamole/guacamole';
import { InstanceRepository } from '../../../infrastructure/repositories';

export class GetInstanceConnectionUseCase implements IUseCase {
    constructor(
        private readonly INSTANCE_PASSWORD: string,
        private readonly instanceRepository: InstanceRepository,
        private readonly guacamole: Guacamole,
        private readonly ec2: EC2,
    ) {}

    execute = async (props: { principal: Principal; instanceId: number }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        if (Number.isNaN(props.instanceId)) {
            throw new createHttpError.NotFound('Instance not found');
        }

        const instance = await this.instanceRepository.updateLastConnectionAtById(props.instanceId);

        if (!instance) {
            throw new createHttpError.NotFound('Instance not found');
        }

        if (!instance.awsInstanceId || !instance.connectionType) {
            throw new createHttpError.BadRequest('Instance is not ready yet');
        }

        if (
            !hasRoleOrAbove('ADMIN', props.principal.role) &&
            props.principal.userId !== instance.userId
        ) {
            throw new createHttpError.Forbidden('You are not authorized to perform this action');
        }

        const ec2Instance = await this.ec2.getInstance(instance.awsInstanceId);

        if (
            ec2Instance === undefined ||
            ec2Instance?.State?.Name !== 'running' ||
            ec2Instance.PublicDnsName === undefined
        ) {
            throw new createHttpError.BadRequest('Instance is not ready yet');
        }

        let connectionString: string | undefined;

        if (instance.connectionType === 'VNC') {
            connectionString = this.guacamole.createVncConnectionString({
                hostname: ec2Instance.PublicDnsName,
                port: 5901,
                cursor: 'local',
                password: this.INSTANCE_PASSWORD,
            });
        } else if (instance.connectionType === 'RDP') {
            // TODO: Review connection settings
            connectionString = this.guacamole.createRdpConnectionString({
                hostname: ec2Instance.PublicDnsName,
                port: 3389,
                password: this.INSTANCE_PASSWORD,
                username: 'developer',
            });
        } else {
            throw new createHttpError.BadRequest('Unsupported connection type');
        }

        return {
            connectionString,
        };
    };
}
