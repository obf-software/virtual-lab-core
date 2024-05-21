import { z } from 'zod';
import { Logger } from '../../logger';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { principalSchema } from '../../../domain/dtos/principal';
import { Errors } from '../../../domain/dtos/errors';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const getInstanceTemplateInputSchema = z.object({
    principal: principalSchema,
    instanceTemplateId: z.string().min(1),
});

export type GetInstanceTemplateInput = z.infer<typeof getInstanceTemplateInputSchema>;

export type GetInstanceTemplateOutput = InstanceTemplate;

export class GetInstanceTemplate {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
    ) {}

    @useCaseExecute(getInstanceTemplateInputSchema)
    async execute(input: GetInstanceTemplateInput): Promise<GetInstanceTemplateOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');

        const instanceTemplate = await this.instanceTemplateRepository.getById(
            input.instanceTemplateId,
        );

        if (!instanceTemplate) {
            throw Errors.resourceNotFound('InstanceTemplate', input.instanceTemplateId);
        }

        return instanceTemplate;
    }
}
