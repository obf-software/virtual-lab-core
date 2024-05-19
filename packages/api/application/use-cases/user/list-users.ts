import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { SeekPaginated, seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';
import { User } from '../../../domain/entities/user';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';

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
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: ListUsersInput): Promise<ListUsersOutput> => {
        this.logger.debug('ListUsers.execute', { input });

        const inputValidation = listUsersInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'USER');

        const paginatedUsers = await this.userRepository.list(
            {
                textSearch: validInput.textSearch,
            },
            validInput.orderBy,
            validInput.order,
            validInput.pagination,
        );
        return paginatedUsers;
    };
}
