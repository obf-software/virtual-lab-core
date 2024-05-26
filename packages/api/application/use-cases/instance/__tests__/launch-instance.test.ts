import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryAuth } from '../../../../infrastructure/auth/in-memory-auth';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryInstanceTemplateRepository } from '../../../../infrastructure/instance-template-repository/in-memory-instance-template-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { LaunchInstance, LaunchInstanceInput } from '../launch-instance';

describe('LaunchInstance use case', () => {
    const logger = new InMemoryLogger();
    const auth = new InMemoryAuth();
    const userRepository = new InMemoryUserRepository();
    const instanceRepository = new InMemoryInstanceRepository();
    const instanceTemplateRepository = new InMemoryInstanceTemplateRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new LaunchInstance(
        logger,
        auth,
        userRepository,
        instanceRepository,
        instanceTemplateRepository,
        virtualizationGateway,
    );

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        userRepository.reset();
        instanceRepository.reset();
        instanceTemplateRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as LaunchInstanceInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When principal role is not USER, then throw insufficientRole', async () => {
        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({
                role: 'NONE',
            }),
            canHibernate: true,
            description: 'description',
            instanceType: 'instanceType',
            name: 'name',
            templateId: '000000000000000000000000',
            ownerId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When user not found, then throw resourceNotFound', async () => {
        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER' }),
            canHibernate: true,
            description: 'description',
            instanceType: 'instanceType',
            name: 'name',
            templateId: '000000000000000000000000',
            ownerId: '000000000000000000000000',
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('User', input.ownerId).message,
        );
    });

    it('When instance template not found, then throw resourceNotFound', async () => {
        const user = userRepository.addTestRecord({ role: 'USER' });
        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: user.role, userId: user.id }),
            canHibernate: true,
            description: 'description',
            instanceType: 'instanceType',
            name: 'name',
            templateId: '000000000000000000000000',
            ownerId: user.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('InstanceTemplate', '000000000000000000000000').message,
        );
    });

    it('When instance type not found, then throw resourceNotFound', async () => {
        const user = userRepository.addTestRecord({ role: 'USER' });
        const template = instanceTemplateRepository.addTestRecord();
        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: user.role, userId: user.id }),
            canHibernate: true,
            description: 'description',
            instanceType: 'instanceType',
            name: 'name',
            templateId: template.id,
            ownerId: user.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('InstanceType', 'instanceType').message,
        );
    });

    it('When machine image is not found, then throw resourceNotFound', async () => {
        const user = userRepository.addTestRecord({ role: 'USER' });
        const template = instanceTemplateRepository.addTestRecord();
        const instanceType = virtualizationGateway.addInstanceTypeTestRecord({
            name: 'instanceType',
        });
        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: user.role, userId: user.id }),
            canHibernate: true,
            description: 'description',
            instanceType: instanceType.name,
            name: 'name',
            templateId: template.id,
            ownerId: user.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('MachineImage', template.machineImageId).message,
        );
    });

    it('When principal is not owner and not ADMIN, then throw insufficientRole', async () => {
        const machineImage = virtualizationGateway.addMachineImageTestRecord();
        const instanceType = virtualizationGateway.addInstanceTypeTestRecord({
            name: 'instanceType',
        });
        const user = userRepository.addTestRecord({
            role: 'USER',
            quotas: {
                allowedInstanceTypes: [instanceType],
                canLaunchInstanceWithHibernation: true,
                maxInstances: 1,
            },
        });
        const template = instanceTemplateRepository.addTestRecord({
            machineImageId: machineImage.id,
        });

        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER' }),
            canHibernate: true,
            description: 'description',
            instanceType: instanceType.name,
            name: 'name',
            templateId: template.id,
            ownerId: user.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.insufficientRole().message);
    });

    it('When user is not ADMIN and max instances reached, then throw businessRuleViolation', async () => {
        const machineImage = virtualizationGateway.addMachineImageTestRecord();
        const instanceType = virtualizationGateway.addInstanceTypeTestRecord({
            name: 'instanceType',
        });
        const user = userRepository.addTestRecord({
            role: 'USER',
            quotas: {
                allowedInstanceTypes: [instanceType],
                canLaunchInstanceWithHibernation: true,
                maxInstances: 1,
            },
        });
        instanceRepository.addTestRecord({ ownerId: user.id });
        const template = instanceTemplateRepository.addTestRecord({
            machineImageId: machineImage.id,
        });

        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER', userId: user.id }),
            canHibernate: true,
            description: 'description',
            instanceType: instanceType.name,
            name: 'name',
            templateId: template.id,
            ownerId: user.id,
        };

        instanceRepository.addTestRecord({ ownerId: user.id });

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.businessRuleViolation('Max instances').message,
        );
    });

    it('When user is not ADMIN and instance type not allowed, then throw businessRuleViolation', async () => {
        const machineImage = virtualizationGateway.addMachineImageTestRecord();
        const instanceType = virtualizationGateway.addInstanceTypeTestRecord({
            name: 'instanceType',
        });
        const user = userRepository.addTestRecord({
            role: 'USER',
            quotas: {
                allowedInstanceTypes: [],
                canLaunchInstanceWithHibernation: true,
                maxInstances: 2,
            },
        });
        const template = instanceTemplateRepository.addTestRecord({
            machineImageId: machineImage.id,
        });

        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER', userId: user.id }),
            canHibernate: true,
            description: 'description',
            instanceType: instanceType.name,
            name: 'name',
            templateId: template.id,
            ownerId: user.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.businessRuleViolation('Instance type').message,
        );
    });

    it('When user is not ADMIN and hibernation not allowed, then throw businessRuleViolation', async () => {
        const machineImage = virtualizationGateway.addMachineImageTestRecord();
        const instanceType = virtualizationGateway.addInstanceTypeTestRecord({
            name: 'instanceType',
        });
        const user = userRepository.addTestRecord({
            role: 'USER',
            quotas: {
                allowedInstanceTypes: [instanceType],
                canLaunchInstanceWithHibernation: false,
                maxInstances: 2,
            },
        });
        const template = instanceTemplateRepository.addTestRecord({
            machineImageId: machineImage.id,
        });

        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER', userId: user.id }),
            canHibernate: true,
            description: 'description',
            instanceType: instanceType.name,
            name: 'name',
            templateId: template.id,
            ownerId: user.id,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.businessRuleViolation('Hibernation').message);
    });

    it('When input is valid, then create instance', async () => {
        const machineImage = virtualizationGateway.addMachineImageTestRecord();
        const instanceType = virtualizationGateway.addInstanceTypeTestRecord({
            name: 'instanceType',
        });
        const user = userRepository.addTestRecord({
            role: 'USER',
            quotas: {
                allowedInstanceTypes: [instanceType],
                canLaunchInstanceWithHibernation: true,
                maxInstances: 2,
            },
        });
        const template = instanceTemplateRepository.addTestRecord({
            machineImageId: machineImage.id,
        });

        const input: LaunchInstanceInput = {
            principal: InMemoryAuth.createTestUserPrincipal({ role: 'USER', userId: user.id }),
            canHibernate: true,
            description: 'description',
            instanceType: instanceType.name,
            name: 'name',
            templateId: template.id,
            ownerId: user.id,
        };

        const instance = await usecase.execute(input);

        expect(instance).toBeDefined();
    });
});
