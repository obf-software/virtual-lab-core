import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import {
    ScheduleInstanceOperation,
    ScheduleInstanceOperationInput,
} from '../schedule-instance-operation';

describe('ScheduleInstanceOperation use case', () => {
    const logger = new InMemoryLogger();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new ScheduleInstanceOperation(logger, virtualizationGateway);

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as ScheduleInstanceOperationInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When input is valid, then schedule instance operation', async () => {
        jest.spyOn(virtualizationGateway, 'scheduleInstanceOperation');
        const input: ScheduleInstanceOperationInput = {
            virtualId: '000000000000000000000000',
            operation: 'turnOff',
        };

        await usecase.execute(input);

        expect(virtualizationGateway.scheduleInstanceOperation).toHaveBeenCalledWith(
            input.virtualId,
            input.operation,
            15,
        );
    });
});
