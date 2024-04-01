import { z } from 'zod';
import { Logger } from '../../logger';
import { Errors } from '../../../domain/dtos/errors';
import { VirtualizationGateway } from '../../virtualization-gateway';

export const unscheduleInstanceOperationInputSchema = z.object({
    virtualId: z.string(),
    operation: z.enum(['turnOff']),
});

export type UnscheduleInstanceOperationInput = z.infer<
    typeof unscheduleInstanceOperationInputSchema
>;

export type UnscheduleInstanceOperationOutput = void;

export class UnscheduleInstanceOperation {
    constructor(
        private readonly logger: Logger,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    async execute(
        input: UnscheduleInstanceOperationInput,
    ): Promise<UnscheduleInstanceOperationOutput> {
        this.logger.debug('UnscheduleInstanceOperation.execute', { input });

        const inputValidation = unscheduleInstanceOperationInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        await this.virtualizationGateway.unscheduleInstanceOperation(
            validInput.virtualId,
            validInput.operation,
        );
    }
}
