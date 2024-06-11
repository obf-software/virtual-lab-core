import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceTemplateRepository } from '../../../../infrastructure/instance-template-repository/in-memory-instance-template-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { DeleteInstanceTemplate, DeleteInstanceTemplateInput } from '../delete-instance-template';

describe('DeleteInstanceTemplate use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceTemplateRepository = new InMemoryInstanceTemplateRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const useCase = new DeleteInstanceTemplate(
        logger,
        auth,
        instanceTemplateRepository,
        virtualizationGateway,
    );

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        instanceTemplateRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as DeleteInstanceTemplateInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below ADMIN, then throw insufficientRole', async () => {
        const input: DeleteInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceTemplateId: '000000000000000000000000',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When instanceTemplate is not found, then throw resourceNotFound', async () => {
        const input: DeleteInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            instanceTemplateId: '000000000000000000000000',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When instanceTemplate is found, then delete instanceTemplate', async () => {
        const { id } = instanceTemplateRepository.addTestRecord();
        const input: DeleteInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            instanceTemplateId: id,
        };

        await useCase.execute(input);

        const instanceTemplate = await instanceTemplateRepository.getById(input.instanceTemplateId);

        expect(instanceTemplate).toBeUndefined();
    });
});
