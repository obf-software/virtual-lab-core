import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { UpdateUserQuotas, UpdateUserQuotasInput } from '../update-user-quotas';

describe('UpdateUserQuotas use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const userRepository = new InMemoryUserRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const useCase = new UpdateUserQuotas(logger, auth, userRepository, virtualizationGateway);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        userRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as UpdateUserQuotasInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below ADMIN, then throw insufficientRole', async () => {
        const input: UpdateUserQuotasInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            maxInstances: 1,
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When userId is not provided, then use principal id', async () => {
        const { id, role, username } = userRepository.addTestRecord({
            role: 'ADMIN',
        });
        const input: UpdateUserQuotasInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role,
                userId: id,
                username,
            }),
            maxInstances: 1,
        };

        const output = await useCase.execute(input);

        expect(output.getData().id).toBe(id);
    });

    it('When user is not found, then throw resourceNotFound', async () => {
        const input: UpdateUserQuotasInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            userId: '000000000000000000000000',
            maxInstances: 1,
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When allowedInstanceTypes is provided, then update user with instance types', async () => {
        const user = userRepository.addTestRecord();
        virtualizationGateway.addInstanceTypeTestRecord({
            name: 't2.nano',
        });
        const input: UpdateUserQuotasInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
                userId: user.id,
                username: user.username,
            }),
            allowedInstanceTypes: ['t2.nano'],
        };

        const output = await useCase.execute(input);

        expect(output.getData().quotas.allowedInstanceTypes.map((v) => v.name)).toEqual([
            't2.nano',
        ]);
    });
});
