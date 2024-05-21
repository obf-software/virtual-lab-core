import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { GetUser, GetUserInput } from '../get-user';

describe('GetUser use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const userRepository = new InMemoryUserRepository();
    const useCase = new GetUser(logger, auth, userRepository);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        userRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {
            principal: InMemoryAuth.createTestUserPrincipal(),
            userId: null as unknown,
        } as GetUserInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below PENDING, then throw insufficientRole', async () => {
        const input: GetUserInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'NONE',
            }),
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When principal role is not ADMIN and userId is different from principal id, then throw insufficientRole', async () => {
        const input: GetUserInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId: '000000000000000000000000',
            }),
            userId: '000000000000000000000001',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When user is not found, then throw resourceNotFound', async () => {
        const input: GetUserInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            userId: '000000000000000000000000',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When user is found, then return user', async () => {
        const user = userRepository.addTestRecord();

        const input: GetUserInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
                userId: user.id,
                username: user.username,
            }),
        };

        const output = await useCase.execute(input);

        expect(output).toBeDefined();
        expect(output.id).toBe(user.id);
    });
});
