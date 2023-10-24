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

        await this.instanceRepository.update(instance);

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
}
