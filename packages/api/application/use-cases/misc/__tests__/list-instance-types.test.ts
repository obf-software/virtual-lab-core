import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { ListInstanceTypes, ListInstanceTypesInput } from '../list-instance-types';

describe('ListInstanceTypes use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const useCase = new ListInstanceTypes(logger, auth, virtualizationGateway);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as ListInstanceTypesInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below USER, then throw insufficientRole', async () => {
        const input: ListInstanceTypesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'PENDING',
            }),
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When input is valid, then return instance types', async () => {
        const input: ListInstanceTypesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
        };

        const output = await useCase.execute(input);

        expect(output).toEqual([]);
    });
});
