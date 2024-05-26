import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { TurnInstanceOn, TurnInstanceOnInput } from '../turn-instance-on';

describe('TurnInstanceOn use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceRepository = new InMemoryInstanceRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new TurnInstanceOn(logger, auth, instanceRepository, virtualizationGateway);

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        instanceRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as TurnInstanceOnInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal has role lower than USER, then throw insufficientRole', async () => {
        const input: TurnInstanceOnInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'NONE',
            }),
            instanceId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole('USER').message);
    });

    it('When instance not found, then throw resourceNotFound', async () => {
        const input: TurnInstanceOnInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('Instance', input.instanceId).message,
        );
    });

    it('When user is not the owner and does not have role ADMIN, then throw resourceAccessDenied', async () => {
        const instance = instanceRepository.addTestRecord({});
        const input: TurnInstanceOnInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceId: instance.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceAccessDenied('Instance', input.instanceId).message,
        );
    });

    it('When instance was not launched yet, then throw businessRuleViolation', async () => {
        const instance = instanceRepository.addTestRecord({});
        const input: TurnInstanceOnInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: instance.ownerId,
            }),
            instanceId: instance.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.businessRuleViolation('Instance was not launched yet').message,
        );
    });

    it('When virtual instance not found, then throw internalError', async () => {
        const instance = instanceRepository.addTestRecord({
            virtualId: 'virtualId',
        });
        const input: TurnInstanceOnInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: instance.ownerId,
            }),
            instanceId: instance.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.internalError('Virtual instance not found').message,
        );
    });

    it('When instance is not ready to turn on, then throw businessRuleViolation', async () => {
        const instance = instanceRepository.addTestRecord({
            virtualId: 'virtualId',
        });
        virtualizationGateway.addInstanceTestRecord({
            virtualId: 'virtualId',
            state: 'PENDING',
        });
        const input: TurnInstanceOnInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: instance.ownerId,
            }),
            instanceId: instance.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.businessRuleViolation('Instance is not ready to turn on').message,
        );
    });

    it('When instance is ready to turn on, then turn on instance', async () => {
        jest.spyOn(virtualizationGateway, 'startInstance');
        const instance = instanceRepository.addTestRecord({
            virtualId: 'virtualId',
        });
        virtualizationGateway.addInstanceTestRecord({
            virtualId: 'virtualId',
            state: 'STOPPED',
        });
        const input: TurnInstanceOnInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: instance.ownerId,
            }),
            instanceId: instance.id,
        };

        await usecase.execute(input);

        expect(virtualizationGateway.startInstance).toHaveBeenCalledWith('virtualId');
    });
});
