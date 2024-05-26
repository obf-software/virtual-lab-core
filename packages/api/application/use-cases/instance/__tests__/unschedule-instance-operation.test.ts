import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import {
    UnscheduleInstanceOperation,
    UnscheduleInstanceOperationInput,
} from '../unschedule-instance-operation';

describe('UnscheduleInstanceOperation use case', () => {
    const logger = new InMemoryLogger();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new UnscheduleInstanceOperation(logger, virtualizationGateway);

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as UnscheduleInstanceOperationInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When input is valid, then unschedule instance operation', async () => {
        jest.spyOn(virtualizationGateway, 'unscheduleInstanceOperation');
        const input: UnscheduleInstanceOperationInput = {
            virtualId: '000000000000000000000000',
            operation: 'turnOff',
        };

        await usecase.execute(input);

        expect(virtualizationGateway.unscheduleInstanceOperation).toHaveBeenCalledWith(
            input.virtualId,
            input.operation,
        );
    });
});
