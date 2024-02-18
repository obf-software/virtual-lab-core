import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { principalSchema } from '../../../domain/dtos/principal';

export const updateInstanceTemplateInputSchema = z
    .object({
        principal: principalSchema,
        instanceTemplateId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
    })
    .refine((data) => !!data.name || !!data.description, {
        message: 'At least one of the following fields must be present: name, description',
    });

export type UpdateInstanceTemplateInput = z.infer<typeof updateInstanceTemplateInputSchema>;

export type UpdateInstanceTemplateOutput = InstanceTemplate;

export class UpdateInstanceTemplate {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
    ) {}

    async execute(input: UpdateInstanceTemplateInput): Promise<UpdateInstanceTemplateOutput> {
        this.logger.debug('UpdateInstanceTemplate.execute', { input });

        const inputValidation = updateInstanceTemplateInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');
        const { id } = this.auth.getClaims(validInput.principal);

        const instanceTemplate = await this.instanceTemplateRepository.getById(
            validInput.instanceTemplateId,
        );

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', validInput.instanceTemplateId);
        }

        if (instanceTemplate.wasCreatedBy(id)) {
            throw Errors.resourceAccessDenied('InstanceTemplate', validInput.instanceTemplateId);
        }

        instanceTemplate.update({
            name: validInput.name,
            description: validInput.description,
        });

        await this.instanceTemplateRepository.update(instanceTemplate);

        return instanceTemplate;
    }
}
