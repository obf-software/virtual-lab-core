import { z } from 'zod';
import { Logger } from '../../logger';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

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
        readonly logger: Logger,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(unscheduleInstanceOperationInputSchema)
    async execute(
        input: UnscheduleInstanceOperationInput,
    ): Promise<UnscheduleInstanceOperationOutput> {
        await this.virtualizationGateway.unscheduleInstanceOperation(
            input.virtualId,
            input.operation,
        );
    }
}
