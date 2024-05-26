import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { ListInstances, ListInstancesInput } from '../list-instances';

describe('ListInstances use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceRepository = new InMemoryInstanceRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new ListInstances(logger, auth, instanceRepository, virtualizationGateway);

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        instanceRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as ListInstancesInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is lower than USER, then throw insufficientRole', async () => {
        const input: ListInstancesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'NONE' }),
            textSearch: 'text',
            ownerId: 'me',
            orderBy: 'alphabetical',
            order: 'asc',
            pagination: { page: 1, resultsPerPage: 10 },
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole('USER').message);
    });

    it('When ownerId is ME, then use principal id as ownerId', async () => {
        jest.spyOn(instanceRepository, 'list');
        const ownerId = '000000000000000000000000';
        const input: ListInstancesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: ownerId,
            }),
            ownerId: 'me',
            orderBy: 'alphabetical',
            order: 'asc',
            pagination: { page: 1, resultsPerPage: 10 },
        };

        await usecase.execute(input);

        expect(instanceRepository.list).toHaveBeenCalledWith(
            expect.objectContaining({
                ownerId: '000000000000000000000000',
            }),
            expect.anything(),
            expect.anything(),
            expect.anything(),
        );
    });

    it('When principal is not ADMIN and ownerId is not principal id, then throw insufficientRole', async () => {
        const input: ListInstancesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER' }),
            ownerId: '000000000000000000000000',
            orderBy: 'alphabetical',
            order: 'asc',
            pagination: { page: 1, resultsPerPage: 10 },
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole('ADMIN').message);
    });

    it('When input is valid, then return paginated instances', async () => {
        const ownerId = '000000000000000000000000';
        const instance = instanceRepository.addTestRecord({ ownerId });
        const input: ListInstancesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'ADMIN' }),
            ownerId,
            orderBy: 'alphabetical',
            order: 'asc',
            pagination: { page: 1, resultsPerPage: 10 },
        };

        const output = await usecase.execute(input);

        expect(output.data).toHaveLength(1);
        expect(output.data[0].id).toEqual(instance.id);
    });
});
