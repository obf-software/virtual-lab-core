import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { SignInUser, SignInUserInput } from '../sign-in-user';

describe('SignInUser use case', () => {
    const logger = new InMemoryLogger();
    const userRepository = new InMemoryUserRepository();
    const useCase = new SignInUser(logger, userRepository);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        userRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as SignInUserInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When user does not exist, then throw resourceNotFound', async () => {
        const input: SignInUserInput = {
            username: 'unknown',
            shouldUpdateLastLoginAt: false,
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When user is found, then return user', async () => {
        const { username, id } = userRepository.addTestRecord();
        const input: SignInUserInput = {
            username,
            shouldUpdateLastLoginAt: false,
        };

        const user = await useCase.execute(input);

        expect(user.id).toBe(id);
    });

    it('When shouldUpdateLastLoginAt is true, then update lastLoginAt', async () => {
        const { username } = userRepository.addTestRecord({
            lastLoginAt: undefined,
        });
        const input: SignInUserInput = {
            username,
            shouldUpdateLastLoginAt: true,
        };

        const user = await useCase.execute(input);

        expect(user.getData().lastLoginAt).not.toBeUndefined();
    });
});
