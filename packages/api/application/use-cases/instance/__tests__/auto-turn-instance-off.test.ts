import { Errors } from '../../../../domain/dtos/errors';
import { InMemoryInstanceRepository } from '../../../../infrastructure/instance-repository/in-memory-instance-repository';
import { InMemoryLogger } from '../../../../infrastructure/logger/in-memory-logger';
import { InMemoryVirtualizationGateway } from '../../../../infrastructure/virtualization-gateway/in-memory-virtualization-gateway';
import { AutoTurnInstanceOff, AutoTurnInstanceOffInput } from '../auto-turn-instance-off';

describe('AutoTurnInstanceOff use case', () => {
    const logger = new InMemoryLogger();
    const instanceRepository = new InMemoryInstanceRepository();
    const virtualizationGateway = new InMemoryVirtualizationGateway();
    const usecase = new AutoTurnInstanceOff(logger, instanceRepository, virtualizationGateway);

    beforeEach(() => {
        jest.restoreAllMocks();

        logger.reset();
        instanceRepository.reset();
        virtualizationGateway.reset();
    });

    it('When input is invalid, then throw validationError', async () => {
        const input = {} as AutoTurnInstanceOffInput;

        const execute = async () => usecase.execute(input);

        await expect(execute).rejects.toThrow(Errors.validationError().message);
    });

    it('When instance is not found, then skip operation', async () => {
        jest.spyOn(virtualizationGateway, 'stopInstance');
        const input: AutoTurnInstanceOffInput = {
            virtualId: '000000000000000000000000',
        };

        await usecase.execute(input);

        expect(virtualizationGateway.stopInstance).not.toHaveBeenCalled();
    });

    it('When instance is found, then stop instance', async () => {
        jest.spyOn(virtualizationGateway, 'stopInstance');
        const { virtualId, state } = virtualizationGateway.addInstanceTestRecord({
            state: 'RUNNING',
        });
        instanceRepository.addTestRecord({ virtualId, state });
        const input: AutoTurnInstanceOffInput = {
            virtualId,
        };

        await usecase.execute(input);

        expect(virtualizationGateway.stopInstance).toHaveBeenCalled();
    });
});
