import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryInstanceTemplateRepository } from '../../../../infrastructure/instance-template-repository/in-memory-instance-template-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import {
    CreateInstanceTemplateFromInstance,
    CreateInstanceTemplateFromInstanceInput,
} from '../create-instance-template-from-instance';

describe('CreateInstanceTemplateFromInstance use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const instanceRepository = new InMemoryInstanceRepository();
    const instanceTemplateRepository = new InMemoryInstanceTemplateRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const useCase = new CreateInstanceTemplateFromInstance(
        logger,
        auth,
        instanceRepository,
        instanceTemplateRepository,
        virtualizationGateway,
    );

    beforeEach(() => {
        jest.clearAllMocks();

        logger.reset();
        instanceRepository.reset();
        instanceTemplateRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as CreateInstanceTemplateFromInstanceInput;

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is below ADMIN, then throw insufficientRole', async () => {
        const input: CreateInstanceTemplateFromInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'USER',
            }),
            instanceId: '000000000000000000000000',
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When instance is not found, then throw resourceNotFound', async () => {
        const input: CreateInstanceTemplateFromInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            instanceId: '000000000000000000000000',
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.resourceNotFound().message);
    });

    it('When instance does not have a virtualId yet, then throw businessRuleViolation', async () => {
        const instance = instanceRepository.addTestRecord({ virtualId: undefined });
        const input: CreateInstanceTemplateFromInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            instanceId: instance.id,
            name: 'name',
            description: 'description',
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.businessRuleViolation().message);
    });

    it('When storageInGb is less than instance storageInGb, then throw businessRuleViolation', async () => {
        const instance = instanceRepository.addTestRecord({ storageInGb: '8' });
        const input: CreateInstanceTemplateFromInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            instanceId: instance.id,
            name: 'name',
            description: 'description',
            storageInGb: 4,
        };

        const execute = async () => useCase.execute(input);

        await expect(execute).rejects.toThrow(Errors.businessRuleViolation().message);
    });

    it('When input is valid, then create instance template and return it', async () => {
        const instance = instanceRepository.addTestRecord({
            storageInGb: '8',
            virtualId: 'virtualId',
            connectionType: 'VNC',
        });
        const input: CreateInstanceTemplateFromInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'ADMIN',
            }),
            instanceId: instance.id,
            name: 'name',
            description: 'description',
        };

        const output = await useCase.execute(input);

        expect(output).toBeDefined();
        expect(output.id).toBeDefined();
    });
});
