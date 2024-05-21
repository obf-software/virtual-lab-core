import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { Errors } from '../../../domain/dtos/errors';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { principalSchema } from '../../../domain/dtos/principal';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const updateInstanceTemplateInputSchema = z
    .object({
        principal: principalSchema,
        instanceTemplateId: z.string().min(1),
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
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
    ) {}

    @useCaseExecute(updateInstanceTemplateInputSchema)
    async execute(input: UpdateInstanceTemplateInput): Promise<UpdateInstanceTemplateOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'ADMIN');
        const { id } = this.auth.getClaims(input.principal);

        const instanceTemplate = await this.instanceTemplateRepository.getById(
            input.instanceTemplateId,
        );

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', input.instanceTemplateId);
        }

        if (!instanceTemplate.wasCreatedBy(id)) {
            throw Errors.resourceAccessDenied('InstanceTemplate', input.instanceTemplateId);
        }

        instanceTemplate.update({
            name: input.name,
            description: input.description,
        });

        await this.instanceTemplateRepository.update(instanceTemplate);

        return instanceTemplate;
    }
}
