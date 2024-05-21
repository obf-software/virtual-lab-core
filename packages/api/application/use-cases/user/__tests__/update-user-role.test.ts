import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { UpdateUserRole, UpdateUserRoleInput } from '../update-user-role';

describe('UpdateUserRole use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const userRepository = new InMemoryUserRepository();
    const useCase = new UpdateUserRole(logger, auth, userRepository);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        userRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as UpdateUserRoleInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below ADMIN, then throw insufficientRole', async () => {
        const input: UpdateUserRoleInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            role: 'USER',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When user is not found, then throw resourceNotFound', async () => {
        const input: UpdateUserRoleInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            userId: '000000000000000000000000',
            role: 'USER',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When userId is not provided, then use principal id', async () => {
        const { id, role, username } = userRepository.addTestRecord({
            role: 'ADMIN',
        });
        const input: UpdateUserRoleInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role,
                userId: id,
                username,
            }),
            role: 'USER',
        };

        const output = await useCase.execute(input);

        expect(output.getData().id).toBe(id);
    });

    it('When user is found, then update role', async () => {
        const { id } = userRepository.addTestRecord({
            role: 'USER',
        });
        const input: UpdateUserRoleInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            userId: id,
            role: 'ADMIN',
        };

        const output = await useCase.execute(input);

        expect(output.getData().role).toBe('ADMIN');
    });
});
