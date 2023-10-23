import { InstanceConnectionType } from '../../../domain/dtos/instance-connection-type';
import { Principal } from '../../../domain/dtos/principal';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { ConnectionEncoder } from '../../connection-encoder';
import { Logger } from '../../logger';
import { InstanceRepository } from '../../repositories/instance-repository';
import { VirtualizationGateway } from '../../virtualization-gateway';

export interface GetInstanceConnectionInput {
    principal: Principal;
    instanceId: number;
}

export interface GetInstanceConnectionOutput {
    connectionString: string;
}

export class GetInstanceConnection {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly connectionEncoder: ConnectionEncoder,
        private readonly virtualizationGateway: VirtualizationGateway,
        private readonly INSTANCE_PASSWORD: string,
    ) {}

    execute = async (input: GetInstanceConnectionInput): Promise<GetInstanceConnectionOutput> => {
        this.logger.debug('GetInstanceConnection.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'USER',
            AuthError.insufficientRole('USER'),
        );

        const principalId = this.auth.getId(input.principal);
        const instance = await this.instanceRepository.getById(input.instanceId);
        if (!instance) throw ApplicationError.resourceNotFound();

        if (
            !this.auth.hasRoleOrAbove(input.principal, 'ADMIN') &&
            instance.getData().userId !== principalId
        ) {
            throw AuthError.insufficientRole('ADMIN');
        }

        const { connectionType, logicalId } = instance.getData();

        if (logicalId === null || connectionType === null) {
            throw ApplicationError.businessRuleViolation('Instance was not provisioned yet');
        }

        const virtualInstance = await this.virtualizationGateway.getInstanceSummaryById(logicalId);

        instance.setState(virtualInstance.state);

        if (!instance.isReadyToConnect()) {
            throw ApplicationError.businessRuleViolation('Instance is not ready yet');
        }

        instance.onUserConnection();

        await this.instanceRepository.save(instance);

        const connectionString =
            connectionType === InstanceConnectionType.VNC
                ? this.connectionEncoder.encodeVncConnection({
                      hostname: virtualInstance.hostname,
                      port: 5901,
                      cursor: 'local',
                      password: this.INSTANCE_PASSWORD,
                  })
                : this.connectionEncoder.encodeRdpConnection({
                      hostname: virtualInstance.hostname,
                      port: 3389,
                      password: this.INSTANCE_PASSWORD,
                      username: 'developer',
                  });

        return { connectionString };
    };

    // execute = async (props: { principal: Principal; instanceId: number }) => {
    //     throwIfInsufficientRole('USER', props.principal.role);

    //     if (Number.isNaN(props.instanceId)) {
    //         throw new createHttpError.NotFound('Instance not found');
    //     }

    //     const instance = await this.instanceRepository.updateLastConnectionAtById(props.instanceId);

    //     if (!instance) {
    //         throw new createHttpError.NotFound('Instance not found');
    //     }

    //     if (!instance.awsInstanceId || !instance.connectionType) {
    //         throw new createHttpError.BadRequest('Instance is not ready yet');
    //     }

    //     if (
    //         !hasRoleOrAbove('ADMIN', props.principal.role) &&
    //         props.principal.userId !== instance.userId
    //     ) {
    //         throw new createHttpError.Forbidden('You are not authorized to perform this action');
    //     }

    //     const ec2Instance = await this.ec2.getInstance(instance.awsInstanceId);

    //     if (
    //         ec2Instance === undefined ||
    //         ec2Instance?.State?.Name !== 'running' ||
    //         ec2Instance.PublicDnsName === undefined
    //     ) {
    //         throw new createHttpError.BadRequest('Instance is not ready yet');
    //     }

    //     let connectionString: string | undefined;

    //     if (instance.connectionType === 'VNC') {
    //         connectionString = this.guacamole.createVncConnectionString({
    //             hostname: ec2Instance.PublicDnsName,
    //             port: 5901,
    //             cursor: 'local',
    //             password: this.INSTANCE_PASSWORD,
    //         });
    //     } else if (instance.connectionType === 'RDP') {
    //         // TODO: Review connection settings
    //         connectionString = this.guacamole.createRdpConnectionString({
    //             hostname: ec2Instance.PublicDnsName,
    //             port: 3389,
    //             password: this.INSTANCE_PASSWORD,
    //             username: 'developer',
    //         });
    //     } else {
    //         throw new createHttpError.BadRequest('Unsupported connection type');
    //     }

    //     return {
    //         connectionString,
    //     };
    // };
}
