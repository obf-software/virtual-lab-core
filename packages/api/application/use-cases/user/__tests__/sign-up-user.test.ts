import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { SignUpUser, SignUpUserInput } from '../sign-up-user';

describe('SignUpUser use case', () => {
    const logger = new InMemoryLogger();
    const userRepository = new InMemoryUserRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const useCase = new SignUpUser(logger, userRepository, virtualizationGateway);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        virtualizationGateway.reset();
        userRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as SignUpUserInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When user already exists, then update and return user', async () => {
        const { username, id } = userRepository.addTestRecord();
        const input: SignUpUserInput = {
            username,
            name: 'John Doe',
            preferredUsername: 'john',
        };

        const user = await useCase.execute(input);

        expect(user.id).toBe(id);
        expect(user.getData().name).toBe(input.name);
        expect(user.getData().preferredUsername).toBe(input.preferredUsername);
    });

    it('When user does not exist, then create and return user', async () => {
        virtualizationGateway.addInstanceTypeTestRecord({
            name: 't3.micro',
        });
        const input: SignUpUserInput = {
            username: 'john',
            name: 'John Doe',
            preferredUsername: 'john',
        };

        const user = await useCase.execute(input);

        expect(user.getData().name).toBe(input.name);
        expect(user.getData().preferredUsername).toBe(input.preferredUsername);
        expect(user.getData().role).toBe('PENDING');
    });

    it('When instance type is not found, then throw internalError', async () => {
        const input: SignUpUserInput = {
            username: 'john',
            name: 'John Doe',
            preferredUsername: 'john',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.internalError().message);
    });
});
