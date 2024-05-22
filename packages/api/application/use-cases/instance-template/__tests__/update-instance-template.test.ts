import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceTemplateRepository } from '../../../../infrastructure/instance-template-repository/in-memory-instance-template-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { UpdateInstanceTemplate, UpdateInstanceTemplateInput } from '../update-instance-template';

describe('UpdateInstanceTemplate use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceTemplateRepository = new InMemoryInstanceTemplateRepository();
    const useCase = new UpdateInstanceTemplate(logger, auth, instanceTemplateRepository);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        instanceTemplateRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as UpdateInstanceTemplateInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below ADMIN, then throw insufficientRole', async () => {
        const input: UpdateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceTemplateId: '000000000000000000000000',
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When instanceTemplate is not found, then throw resourceNotFound', async () => {
        const input: UpdateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            instanceTemplateId: '000000000000000000000000',
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When instanceTemplate was not createdBy principal, then throw resourceAccessDenied', async () => {
        const instanceTemplate = instanceTemplateRepository.addTestRecord({
            createdBy: '000000000000000000000000',
        });
        const input: UpdateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
                userId: '000000000000000000000001',
            }),
            instanceTemplateId: instanceTemplate.id,
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceAccessDenied().message);
    });

    it('When instanceTemplate is found, then update instanceTemplate', async () => {
        const instanceTemplate = instanceTemplateRepository.addTestRecord();
        const input: UpdateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
                userId: instanceTemplate.createdBy,
            }),
            instanceTemplateId: instanceTemplate.id,
            name: 'new name',
            description: 'new description',
        };

        const output = await useCase.execute(input);

        expect(output.id).toEqual(instanceTemplate.id);
        expect(output.getData().name).toEqual(input.name);
        expect(output.getData().description).toEqual(input.description);
    });
});
