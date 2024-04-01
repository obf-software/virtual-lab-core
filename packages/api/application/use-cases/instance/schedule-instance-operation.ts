import { z } from 'zod';
import { Logger } from '../../logger';
import { Errors } from '../../../domain/dtos/errors';
import { VirtualizationGateway } from '../../virtualization-gateway';

export const scheduleInstanceOperationInputSchema = z.object({
    virtualId: z.string(),
    operation: z.enum(['turnOff']),
});

export type ScheduleInstanceOperationInput = z.infer<typeof scheduleInstanceOperationInputSchema>;

export type ScheduleInstanceOperationOutput = void;

export class ScheduleInstanceOperation {
    constructor(
        private readonly logger: Logger,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    async execute(input: ScheduleInstanceOperationInput): Promise<ScheduleInstanceOperationOutput> {
        this.logger.debug('ScheduleInstanceOperation.execute', { input });

        const inputValidation = scheduleInstanceOperationInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        await this.virtualizationGateway.scheduleInstanceOperation(
            validInput.virtualId,
            validInput.operation,
            15,
        );
    }
}
