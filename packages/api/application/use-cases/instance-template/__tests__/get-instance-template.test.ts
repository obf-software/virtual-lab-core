import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceTemplateRepository } from '../../../../infrastructure/instance-template-repository/in-memory-instance-template-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { GetInstanceTemplate, GetInstanceTemplateInput } from '../get-instance-template';

describe('GetInstanceTemplate use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceTemplateRepository = new InMemoryInstanceTemplateRepository();
    const useCase = new GetInstanceTemplate(logger, auth, instanceTemplateRepository);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        instanceTemplateRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as GetInstanceTemplateInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below USER, then throw insufficientRole', async () => {
        const input: GetInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'NONE',
            }),
            instanceTemplateId: '000000000000000000000000',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When instanceTemplate is not found, then throw resourceNotFound', async () => {
        const input: GetInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceTemplateId: '000000000000000000000000',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When instanceTemplate is found, then return instanceTemplate', async () => {
        const instanceTemplate = instanceTemplateRepository.addTestRecord();
        const input: GetInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceTemplateId: instanceTemplate.id,
        };

        const output = await useCase.execute(input);

        expect(output.id).toEqual(instanceTemplate.id);
    });
});
