import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceTemplateRepository } from '../../../../infrastructure/instance-template-repository/in-memory-instance-template-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { CreateInstanceTemplate, CreateInstanceTemplateInput } from '../create-instance-template';

describe('CreateInstanceTemplate use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceTemplateRepository = new InMemoryInstanceTemplateRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const useCase = new CreateInstanceTemplate(
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
        const input = {} as CreateInstanceTemplateInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below ADMIN, then throw insufficientRole', async () => {
        const input: CreateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            machineImageId: '12345',
            storageInGb: 10,
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When machineImage is not found, then throw resourceNotFound', async () => {
        const input: CreateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            machineImageId: 'ID_NOT_FOUND',
            storageInGb: 10,
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When machineImage platform is UNKNOWN, then throw businessRuleViolation', async () => {
        const { id } = virtualizationGateway.addMachineImageTestRecord({
            platform: 'UNKNOWN',
        });
        const input: CreateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            machineImageId: id,
            storageInGb: 10,
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.businessRuleViolation().message);
    });

    it('When storageInGb is less than machineImage storageInGb, then throw businessRuleViolation', async () => {
        virtualizationGateway.addInstancePlatformToProductMapTestRecord({
            platform: 'LINUX',
            product: {},
        });
        const { id } = virtualizationGateway.addMachineImageTestRecord({
            storageInGb: 10,
            platform: 'LINUX',
        });
        const input: CreateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            machineImageId: id,
            storageInGb: 5,
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.businessRuleViolation().message);
    });

    it('When input is valid, then create instance template', async () => {
        virtualizationGateway.addInstancePlatformToProductMapTestRecord({
            platform: 'LINUX',
            product: {},
        });
        const { id } = virtualizationGateway.addMachineImageTestRecord({
            storageInGb: 10,
            platform: 'LINUX',
        });
        const input: CreateInstanceTemplateInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            machineImageId: id,
            storageInGb: 10,
            name: 'name',
            description: 'description',
        };

        const output = await useCase.execute(input);

        expect(output).toBeDefined();
        expect(output.id).toBeDefined();
    });
});
