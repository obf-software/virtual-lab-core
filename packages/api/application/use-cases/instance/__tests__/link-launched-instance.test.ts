import { InstanceLaunched } from '../../../../domain/application-events/instance-launched';
import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryEventPublisher } from '../../../../infrastructure/event-publisher/in-memory-event-publisher';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { LinkLaunchedInstance, LinkLaunchedInstanceInput } from '../link-launched-instance';

describe('LinkLaunchedInstance use case', () => {
    const logger = new InMemoryLogger();

    const userRepository = new InMemoryUserRepository();
    const instanceRepository = new InMemoryInstanceRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const eventPublisher = new InMemoryEventPublisher();
    const usecase = new LinkLaunchedInstance(
        logger,
        userRepository,
        instanceRepository,
        virtualizationGateway,
        eventPublisher,
    );

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        userRepository.reset();
        instanceRepository.reset();
        virtualizationGateway.reset();
        eventPublisher.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as LinkLaunchedInstanceInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When virtual instance not found, then throw resourceNotFound', async () => {
        const instanceStack = virtualizationGateway.addInstanceStackTestRecord();
        const input: LinkLaunchedInstanceInput = {
            stackName: instanceStack.stackName,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('VirtualInstance', instanceStack.virtualId).message,
        );
    });

    it('When instance not found, then throw resourceNotFound', async () => {
        const virtualInstance = virtualizationGateway.addInstanceTestRecord();
        const instanceStack = virtualizationGateway.addInstanceStackTestRecord({
            virtualId: virtualInstance.virtualId,
        });
        const input: LinkLaunchedInstanceInput = {
            stackName: instanceStack.stackName,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('Instance', instanceStack.launchToken).message,
        );
    });

    it('When user not found, then throw resourceNotFound', async () => {
        const virtualInstance = virtualizationGateway.addInstanceTestRecord();
        const instanceStack = virtualizationGateway.addInstanceStackTestRecord({
            virtualId: virtualInstance.virtualId,
        });
        const instance = instanceRepository.addTestRecord({
            launchToken: instanceStack.launchToken,
        });
        const input: LinkLaunchedInstanceInput = {
            stackName: instanceStack.stackName,
        };

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(
            Errors.resourceNotFound('User', instance.ownerId).message,
        );
    });

    it('When all data is valid, then update instance and publish event', async () => {
        const virtualInstance = virtualizationGateway.addInstanceTestRecord();
        const instanceStack = virtualizationGateway.addInstanceStackTestRecord({
            virtualId: virtualInstance.virtualId,
        });
        const instance = instanceRepository.addTestRecord({
            launchToken: instanceStack.launchToken,
        });
        userRepository.addTestRecord({
            id: instance.ownerId,
        });
        const input: LinkLaunchedInstanceInput = {
            stackName: instanceStack.stackName,
        };

        await usecase.execute(input);

        const updatedInstance = await instanceRepository.getById(instance.id);

        expect(updatedInstance?.getData().virtualId).toBe(virtualInstance.virtualId);
        expect(updatedInstance?.getData().connectionType).toBe(instanceStack.connectionType);
        expect(eventPublisher.storage).toHaveLength(1);
        expect(eventPublisher.storage[0]).toBeInstanceOf(InstanceLaunched);
    });
});
