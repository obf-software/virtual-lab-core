import { z } from 'zod';
import { Auth } from '../../auth';
import { ConnectionEncoder } from '../../connection-encoder';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { ConfigVault } from '../../config-vault';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const getInstanceConnectionInputSchema = z
    .object({
        principal: principalSchema,
        instanceId: z.string().min(1),
    })
    .strict();
export type GetInstanceConnectionInput = z.infer<typeof getInstanceConnectionInputSchema>;

export interface GetInstanceConnectionOutput {
    connectionString: string;
}

export class GetInstanceConnection {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly connectionEncoder: ConnectionEncoder,
        private readonly virtualizationGateway: VirtualizationGateway,
        private readonly configVault: ConfigVault,
        private readonly INSTANCE_PASSWORD_PARAMETER_NAME: string,
    ) {}

    @useCaseExecute(getInstanceConnectionInputSchema)
    async execute(input: GetInstanceConnectionInput): Promise<GetInstanceConnectionOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');
        const { id } = this.auth.getClaims(input.principal);

        const [instancePassword, instance] = await Promise.all([
            this.configVault.getParameter(this.INSTANCE_PASSWORD_PARAMETER_NAME),
            this.instanceRepository.getById(input.instanceId),
        ]);

        if (!instance) {
            throw Errors.resourceNotFound('Instance', input.instanceId);
        }

        if (!instancePassword) {
            throw Errors.internalError(
                `Failed to retrieve ${this.INSTANCE_PASSWORD_PARAMETER_NAME} from config vault`,
            );
        }

        const { virtualId } = instance.getData();

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && !instance.isOwnedBy(id)) {
            throw Errors.resourceAccessDenied('Instance', input.instanceId);
        }

        if (!instance.hasBeenLaunched() || virtualId === undefined) {
            throw Errors.businessRuleViolation('Instance has not been launched yet');
        }

        const [virtualInstance, isReadyToConnect] = await Promise.all([
            this.virtualizationGateway.getInstance(virtualId),
            this.virtualizationGateway.isInstanceReadyToConnect(virtualId),
        ]);

        if (!isReadyToConnect) {
            throw Errors.businessRuleViolation('Instance is being prepared for connection');
        }

        if (!virtualInstance) {
            throw Errors.resourceNotFound('Virtual instance', virtualId);
        }

        instance.onStateRetrieved(virtualInstance.state);

        if (!instance.isReadyToConnect()) {
            throw Errors.businessRuleViolation('Instance is not ready yet');
        }

        instance.onUserConnected();
        await this.instanceRepository.update(instance);

        const connectionStringPromise =
            instance.getData().connectionType === 'VNC'
                ? this.connectionEncoder.encodeVncConnection({
                      hostname: virtualInstance.hostname,
                      port: 5901,
                      cursor: 'local',
                      password: instancePassword,
                  })
                : this.connectionEncoder.encodeRdpConnection({
                      hostname: virtualInstance.hostname,
                      port: 3389,
                      'enable-sftp': false,
                      security: 'any',
                      'ignore-cert': true,
                      width: 1024,
                      height: 768,
                      password: instancePassword,
                      username: 'developer',
                  });

        const connectionString = await connectionStringPromise;

        return {
            connectionString: `${connectionString}&virtualId=${virtualId}`,
        };
    }
}
