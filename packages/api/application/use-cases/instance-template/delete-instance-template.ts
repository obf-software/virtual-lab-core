import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { principalSchema } from '../../../domain/dtos/principal';
import { Errors } from '../../../domain/dtos/errors';

export const deleteInstanceTemplateInputSchema = z.object({
    principal: principalSchema,
    instanceTemplateId: z.string().min(1),
});

export type DeleteInstanceTemplateInput = z.infer<typeof deleteInstanceTemplateInputSchema>;

export type DeleteInstanceTemplateOutput = void;

export class DeleteInstanceTemplate {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
    ) {}

    async execute(input: DeleteInstanceTemplateInput): Promise<DeleteInstanceTemplateOutput> {
        this.logger.debug('DeleteInstanceTemplate.execute', { input });

        const inputValidation = deleteInstanceTemplateInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');

        const instanceTemplate = await this.instanceTemplateRepository.getById(
            validInput.instanceTemplateId,
        );

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', validInput.instanceTemplateId);
        }

        await this.instanceTemplateRepository.delete(instanceTemplate);
    }
}
