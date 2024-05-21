import { z } from 'zod';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { InstanceTemplateRepository } from '../../instance-template-repository';
import { SeekPaginated, seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';
import { InstanceTemplate } from '../../../domain/entities/instance-template';
import { principalSchema } from '../../../domain/dtos/principal';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

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
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly instanceTemplateRepository: InstanceTemplateRepository,
    ) {}

    @useCaseExecute(listInstanceTemplatesInputSchema)
    async execute(input: ListInstanceTemplatesInput): Promise<ListInstanceTemplatesOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');
        const { id } = this.auth.getClaims(input.principal);

        const createdBy = input.createdBy === 'me' ? id : input.createdBy;

        const instanceTemplates = await this.instanceTemplateRepository.list(
            {
                createdBy,
                textSearch: input.textSearch,
            },
            input.orderBy,
            input.order,
            input.pagination,
        );

        return instanceTemplates;
    }
}
