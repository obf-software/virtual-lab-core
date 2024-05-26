import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { DeleteInstance, DeleteInstanceInput } from '../delete-instance';

describe('DeleteInstance use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceRepository = new InMemoryInstanceRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new DeleteInstance(logger, auth, instanceRepository, virtualizationGateway);

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        instanceRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as DeleteInstanceInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal has insufficient role, then throw insufficientRole', async () => {
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'PENDING' }),
            instanceId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When instance is not found, then throw resourceNotFound', async () => {
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER' }),
            instanceId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When principal has not ADMIN role and is not owner, then throw resourceAccessDenied', async () => {
        const { id, ownerId } = instanceRepository.addTestRecord({
            ownerId: '000000000000000000000001',
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER' }),
            instanceId: id,
        };
        instanceRepository.addTestRecord({ ownerId });

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceAccessDenied().message);
    });

    it('When input is valid, then delete instance and terminate virtual instance stack', async () => {
        jest.spyOn(instanceRepository, 'delete');
        jest.spyOn(virtualizationGateway, 'terminateInstance');
        const { launchToken, virtualId } = virtualizationGateway.addInstanceTestRecord();
        const { id, ownerId } = instanceRepository.addTestRecord({
            launchToken,
            virtualId,
        });
        const input: DeleteInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER', userId: ownerId }),
            instanceId: id,
        };

        await usecase.execute(input);

        expect(instanceRepository.delete).toHaveBeenCalled();
        expect(virtualizationGateway.terminateInstance).toHaveBeenCalledWith(launchToken);
    });
});
