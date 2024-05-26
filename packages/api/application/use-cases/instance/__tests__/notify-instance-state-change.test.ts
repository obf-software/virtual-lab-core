import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryEventPublisher } from '../../../../infrastructure/event-publisher/in-memory-event-publisher';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryUserRepository } from '../../../../infrastructure/user-repository/in-memory-user-repository';
import {
    NotifyInstanceStateChange,
    NotifyInstanceStateChangeInput,
} from '../notify-instance-state-change';

describe('NotifyInstanceStateChange use case', () => {
    const logger = new InMemoryLogger();
    const instanceRepository = new InMemoryInstanceRepository();
    const userRepository = new InMemoryUserRepository();
    const eventPublisher = new InMemoryEventPublisher();
    const usecase = new NotifyInstanceStateChange(
        logger,
        instanceRepository,
        userRepository,
        eventPublisher,
    );

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        instanceRepository.reset();
        userRepository.reset();
        eventPublisher.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as NotifyInstanceStateChangeInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When instance not found, then do nothing', async () => {
        jest.spyOn(userRepository, 'getById');
        const input: NotifyInstanceStateChangeInput = {
            virtualId: 'virtualId',
            state: 'RUNNING',
        };

        await usecase.execute(input);

        expect(userRepository.getById).not.toHaveBeenCalled();
    });

    it('When user not found, then do nothing', async () => {
        const instance = instanceRepository.addTestRecord({ virtualId: 'virtualId' });
        const input: NotifyInstanceStateChangeInput = {
            virtualId: instance.virtualId!,
            state: 'RUNNING',
        };

        await usecase.execute(input);

        expect(eventPublisher.storage).toHaveLength(0);
    });

    it('When instance is running, then publish events', async () => {
        const user = userRepository.addTestRecord({});
        const instance = instanceRepository.addTestRecord({
            ownerId: user.id,
            virtualId: 'virtualIdx',
        });
        const input: NotifyInstanceStateChangeInput = {
            virtualId: instance.virtualId!,
            state: 'RUNNING',
        };

        await usecase.execute(input);

        expect(eventPublisher.storage).toHaveLength(2);
    });
});
