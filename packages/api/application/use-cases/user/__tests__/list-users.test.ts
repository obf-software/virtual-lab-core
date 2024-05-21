import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { ListUsers, ListUsersInput } from '../list-users';

describe('ListUsers use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const userRepository = new InMemoryUserRepository();
    const useCase = new ListUsers(logger, auth, userRepository);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        userRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as ListUsersInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below USER, then throw insufficientRole', async () => {
        const input: ListUsersInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'NONE',
            }),
            order: 'asc',
            orderBy: 'creationDate',
            pagination: {
                page: 1,
                resultsPerPage: 10,
            },
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When input is valid, then return paginated users', async () => {
        const input: ListUsersInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            order: 'asc',
            orderBy: 'creationDate',
            pagination: {
                page: 1,
                resultsPerPage: 10,
            },
        };

        const output = await useCase.execute(input);

        expect(output.data).toHaveLength(0);
        expect(output.numberOfPages).toBe(0);
        expect(output.numberOfResults).toBe(0);
        expect(output.resultsPerPage).toBe(input.pagination.resultsPerPage);
    });
});
