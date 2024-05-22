import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceTemplateRepository } from '../../../../infrastructure/instance-template-repository/in-memory-instance-template-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { ListInstanceTemplates, ListInstanceTemplatesInput } from '../list-instance-templates';

describe('ListInstanceTemplates use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceTemplateRepository = new InMemoryInstanceTemplateRepository();
    const useCase = new ListInstanceTemplates(logger, auth, instanceTemplateRepository);

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        instanceTemplateRepository.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as ListInstanceTemplatesInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below USER, then throw insufficientRole', async () => {
        const input: ListInstanceTemplatesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'NONE',
            }),
            textSearch: 'textSearch',
            orderBy: 'creationDate',
            order: 'asc',
            pagination: {
                page: 1,
                resultsPerPage: 10,
            },
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When createdBy is me, then list instanceTemplates created by principal', async () => {
        const userId = '000000000000000000000000';
        const instanceTemplate1 = instanceTemplateRepository.addTestRecord({
            createdBy: userId,
        });
        instanceTemplateRepository.addTestRecord({
            createdBy: '000000000000000000000001',
        });

        const input: ListInstanceTemplatesInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
                userId,
            }),
            createdBy: 'me',
            orderBy: 'creationDate',
            order: 'asc',
            pagination: {
                page: 1,
                resultsPerPage: 10,
            },
        };

        const output = await useCase.execute(input);

        expect(output.data).toHaveLength(1);
        expect(output.data[0].id).toBe(instanceTemplate1.id);
        expect(output.numberOfPages).toBe(1);
        expect(output.numberOfResults).toBe(1);
        expect(output.resultsPerPage).toBe(10);
    });
});
