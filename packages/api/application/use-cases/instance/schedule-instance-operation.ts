import { z } from 'zod';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const scheduleInstanceOperationInputSchema = z.object({
    virtualId: z.string(),
    operation: z.enum(['turnOff']),
});

export type ScheduleInstanceOperationInput = z.infer<typeof scheduleInstanceOperationInputSchema>;

export type ScheduleInstanceOperationOutput = void;

export class ScheduleInstanceOperation {
    constructor(
        readonly logger: Logger,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(scheduleInstanceOperationInputSchema)
    async execute(input: ScheduleInstanceOperationInput): Promise<ScheduleInstanceOperationOutput> {
        await this.virtualizationGateway.scheduleInstanceOperation(
            input.virtualId,
            input.operation,
            15,
        );
    }
}
