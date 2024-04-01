import { z } from 'zod';
import { Auth } from '../../auth';
import { ConnectionEncoder } from '../../connection-encoder';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { principalSchema } from '../../../domain/dtos/principal';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';
import { ConfigVault } from '../../config-vault';

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
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceRepository: InstanceRepository,
        private readonly connectionEncoder: ConnectionEncoder,
        private readonly virtualizationGateway: VirtualizationGateway,
        private readonly configVault: ConfigVault,
        private readonly INSTANCE_PASSWORD_PARAMETER_NAME: string,
    ) {}

    execute = async (input: GetInstanceConnectionInput): Promise<GetInstanceConnectionOutput> => {
        this.logger.debug('GetInstanceConnection.execute', { input });

        const inputValidation = getInstanceConnectionInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');
        const { id } = this.auth.getClaims(validInput.principal);

        const [instancePassword, instance] = await Promise.all([
            this.configVault.getParameter(this.INSTANCE_PASSWORD_PARAMETER_NAME),
            this.instanceRepository.getById(validInput.instanceId),
        ]);

        if (!instance) {
            throw Errors.resourceNotFound('Instance', validInput.instanceId);
        }

        if (!instancePassword) {
            throw Errors.internalError(
                `Failed to retrieve ${this.INSTANCE_PASSWORD_PARAMETER_NAME} from config vault`,
            );
        }

        const { virtualId } = instance.getData();

        if (!this.auth.hasRoleOrAbove(validInput.principal, 'ADMIN') && !instance.isOwnedBy(id)) {
            throw Errors.resourceAccessDenied('Instance', validInput.instanceId);
        }

        if (!instance.hasBeenLaunched() || virtualId === undefined) {
            throw Errors.businessRuleViolation('Instance has not been launched yet');
        }

        const virtualInstance = await this.virtualizationGateway.getInstance(virtualId);

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
    };
}
