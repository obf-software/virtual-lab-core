import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { principalSchema } from '../../../domain/dtos/principal';
import { Errors } from '../../../domain/dtos/errors';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';
import { VirtualizationGateway } from '../../virtualization-gateway';

export const deleteInstanceTemplateInputSchema = z.object({
    principal: principalSchema,
    instanceTemplateId: z.string().min(1),
});

export type DeleteInstanceTemplateInput = z.infer<typeof deleteInstanceTemplateInputSchema>;

export type DeleteInstanceTemplateOutput = void;

export class DeleteInstanceTemplate {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(deleteInstanceTemplateInputSchema)
    async execute(input: DeleteInstanceTemplateInput): Promise<DeleteInstanceTemplateOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'ADMIN');

        const instanceTemplate = await this.instanceTemplateRepository.getById(
            input.instanceTemplateId,
        );

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', input.instanceTemplateId);
        }

        const results = await Promise.allSettled([
            this.virtualizationGateway.deleteMachineImage(
                instanceTemplate.getData().machineImageId,
            ),
            this.instanceTemplateRepository.delete(instanceTemplate),
        ]);

        results
            .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
            .forEach((result) => {
                this.logger.error('Error deleting instance template', { error: result.reason });
            });
    }
}
