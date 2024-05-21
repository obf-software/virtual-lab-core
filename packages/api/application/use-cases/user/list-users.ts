import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { SeekPaginated, seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';
import { User } from '../../../domain/entities/user';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const listUsersInputSchema = z
    .object({
        principal: principalSchema,
        textSearch: z.string().min(1).optional(),
        orderBy: z.enum(['creationDate', 'lastUpdateDate', 'lastLoginDate', 'alphabetical']),
        order: z.enum(['asc', 'desc']),
        pagination: seekPaginationInputSchema,
    })
    .strict();
export type ListUsersInput = z.infer<typeof listUsersInputSchema>;

export type ListUsersOutput = SeekPaginated<User>;

export class ListUsers {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    @useCaseExecute(listUsersInputSchema)
    async execute(input: ListUsersInput): Promise<ListUsersOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'USER');

        const paginatedUsers = await this.userRepository.list(
            {
                textSearch: input.textSearch,
            },
            input.orderBy,
            input.order,
            input.pagination,
        );
        return paginatedUsers;
    }
}
