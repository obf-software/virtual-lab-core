import { z } from 'zod';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { InstanceRepository } from '../../instance-repository';
import { Errors } from '../../../domain/dtos/errors';

export const autoTurnInstanceOffInputSchema = z
    .object({
        virtualId: z.string().min(1),
    })
    .strict();
export type AutoTurnInstanceOffInput = z.infer<typeof autoTurnInstanceOffInputSchema>;

export type AutoTurnInstanceOffOutput = void;

export class AutoTurnInstanceOff {
    constructor(
        private readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: AutoTurnInstanceOffInput): Promise<AutoTurnInstanceOffOutput> => {
        this.logger.debug('AutoTurnInstanceOff.execute', { input });

        const inputValidation = autoTurnInstanceOffInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        const instance = await this.instanceRepository.getByVirtualId(validInput.virtualId);

        if (!instance) {
            this.logger.warn('Instance not found', { virtualId: validInput.virtualId });
        }

        await this.virtualizationGateway.stopInstance(
            validInput.virtualId,
            instance?.getData().canHibernate ?? false,
            false,
        );
    };
}
