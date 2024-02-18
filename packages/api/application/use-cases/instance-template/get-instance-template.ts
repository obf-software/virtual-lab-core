import { z } from 'zod';
import { Logger } from '../../logger';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { principalSchema } from '../../../domain/dtos/principal';
import { Errors } from '../../../domain/dtos/errors';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';

export const getInstanceTemplateInputSchema = z.object({
    principal: principalSchema,
    instanceTemplateId: z.string().min(1),
});

export type GetInstanceTemplateInput = z.infer<typeof getInstanceTemplateInputSchema>;

export type GetInstanceTemplateOutput = InstanceTemplate;

export class GetInstanceTemplate {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
    ) {}

    async execute(input: GetInstanceTemplateInput): Promise<GetInstanceTemplateOutput> {
        this.logger.debug('GetInstanceTemplate.execute', { input });

        const inputValidation = getInstanceTemplateInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');

        const instanceTemplate = await this.instanceTemplateRepository.getById(
            validInput.instanceTemplateId,
        );

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', validInput.instanceTemplateId);
        }

        return instanceTemplate;
    }
}
