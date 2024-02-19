import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { SeekPaginated, seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { principalSchema } from '../../../domain/dtos/principal';
import { Errors } from '../../../domain/dtos/errors';

export const listInstanceTemplatesInputSchema = z.object({
    principal: principalSchema,
    createdBy: z.string().min(1).optional(),
    textSearch: z.string().min(1).optional(),
    orderBy: z.enum(['creationDate', 'lastUpdateDate', 'alphabetical']),
    order: z.enum(['asc', 'desc']),
    pagination: seekPaginationInputSchema,
});

export type ListInstanceTemplatesInput = z.infer<typeof listInstanceTemplatesInputSchema>;

export type ListInstanceTemplatesOutput = SeekPaginated<InstanceTemplate>;

export class ListInstanceTemplates {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
    ) {}

    async execute(input: ListInstanceTemplatesInput): Promise<ListInstanceTemplatesOutput> {
        this.logger.debug('ListInstanceTemplates.execute', { input });

        const inputValidation = listInstanceTemplatesInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');
        const { id } = this.auth.getClaims(validInput.principal);

        const createdBy = validInput.createdBy === 'me' ? id : validInput.createdBy;

        const instanceTemplates = await this.instanceTemplateRepository.list(
            {
                createdBy,
                textSearch: validInput.textSearch,
            },
            validInput.orderBy,
            validInput.order,
            validInput.pagination,
        );

        return instanceTemplates;
    }
}
