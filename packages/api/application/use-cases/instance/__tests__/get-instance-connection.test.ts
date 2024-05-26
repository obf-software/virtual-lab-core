import { randomUUID } from 'crypto';
import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryConfigVault } from '../../../../infrastructure/config-vault/in-memory-config-vault';
import { GuacamoleConnectionEncoder } from '../../../../infrastructure/connection-encoder/guacamole-connection-encoder';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { DeleteInstanceInput } from '../delete-instance';
import { GetInstanceConnection, GetInstanceConnectionInput } from '../get-instance-connection';

describe('GetInstanceConnection use case', () => {
    const INSTANCE_PASSWORD_PARAMETER_NAME = 'INSTANCE_PASSWORD';
    const GUACAMOLE_CYPHER_KEY_PARAMETER_NAME = 'GUACAMOLE_CYPHER_KEY';
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceRepository = new InMemoryInstanceRepository();
    const configVault = new InMemoryConfigVault({
        parameters: {
            [INSTANCE_PASSWORD_PARAMETER_NAME]: 'passwd',
            [GUACAMOLE_CYPHER_KEY_PARAMETER_NAME]: '00000000000000000000000000000000',
        },
    });

    const connectionEncoder = new GuacamoleConnectionEncoder({
        configVault,
        GUACAMOLE_CYPHER_KEY_PARAMETER_NAME,
    });
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new GetInstanceConnection(
        logger,
        auth,
        instanceRepository,
        connectionEncoder,
        virtualizationGateway,
        configVault,
        INSTANCE_PASSWORD_PARAMETER_NAME,
    );

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        instanceRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as GetInstanceConnectionInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is not USER, then throw insufficientRole', async () => {
        const input: GetInstanceConnectionInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'NONE',
            }),
            instanceId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When instance is not found, then throw resourceNotFound', async () => {
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When instance password is not found, then throw internalError', async () => {
        jest.spyOn(configVault, 'getParameter').mockResolvedValueOnce(undefined);
        const { id, ownerId } = instanceRepository.addTestRecord();
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: ownerId,
            }),
            instanceId: id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.internalError().message);
    });

    it('When principal is not owner and not ADMIN, then throw resourceAccessDenied', async () => {
        const { id } = instanceRepository.addTestRecord({
            ownerId: '000000000000000000000000',
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: '000000000000000000000001',
            }),
            instanceId: id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceAccessDenied().message);
    });

    it('When instance has not been launched, then throw businessRuleViolation', async () => {
        const { id, ownerId } = instanceRepository.addTestRecord({
            virtualId: undefined,
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: ownerId,
            }),
            instanceId: id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.businessRuleViolation().message);
    });

    it('When virtual instance is not found, then throw resourceNotFound', async () => {
        const { id, ownerId } = instanceRepository.addTestRecord({
            virtualId: randomUUID(),
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: ownerId,
            }),
            instanceId: id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When instance is not ready to connect, then throw businessRuleViolation', async () => {
        const virtualInstance = virtualizationGateway.addInstanceTestRecord({ state: 'STOPPED' });
        const { id, ownerId } = instanceRepository.addTestRecord({
            virtualId: virtualInstance.virtualId,
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: ownerId,
            }),
            instanceId: id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.businessRuleViolation().message);
    });

    it('When everything is correct and connection type is RDP, then return connection string', async () => {
        const virtualInstance = virtualizationGateway.addInstanceTestRecord({ state: 'RUNNING' });
        const { id, ownerId } = instanceRepository.addTestRecord({
            virtualId: virtualInstance.virtualId,
            connectionType: 'RDP',
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: ownerId,
            }),
            instanceId: id,
        };

        const output = await usecase.execute(input);

        expect(output).toBeDefined();
        expect(output.connectionString).toBeDefined();
    });

    it('When everything is correct and connection type is VNC, then return connection string', async () => {
        const virtualInstance = virtualizationGateway.addInstanceTestRecord({ state: 'RUNNING' });
        const { id, ownerId } = instanceRepository.addTestRecord({
            virtualId: virtualInstance.virtualId,
            connectionType: 'VNC',
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: ownerId,
            }),
            instanceId: id,
        };

        const output = await usecase.execute(input);

        expect(output).toBeDefined();
        expect(output.connectionString).toBeDefined();
    });
});
