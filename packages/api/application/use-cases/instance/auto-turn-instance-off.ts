import { z } from 'zod';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { InstanceRepository } from '../../instance-repository';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const autoTurnInstanceOffInputSchema = z
    .object({
        virtualId: z.string().min(1),
    })
    .strict();
export type AutoTurnInstanceOffInput = z.infer<typeof autoTurnInstanceOffInputSchema>;

export type AutoTurnInstanceOffOutput = void;

export class AutoTurnInstanceOff {
    constructor(
        readonly logger: Logger,
        private readonly instanceRepository: InstanceRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(autoTurnInstanceOffInputSchema)
    async execute(input: AutoTurnInstanceOffInput): Promise<AutoTurnInstanceOffOutput> {
        const instance = await this.instanceRepository.getByVirtualId(input.virtualId);

        if (!instance) {
            this.logger.warn('Instance not found', { virtualId: input.virtualId });
        }

        await this.virtualizationGateway.stopInstance(
            input.virtualId,
            instance?.getData().canHibernate ?? false,
            false,
        );
    }
}
