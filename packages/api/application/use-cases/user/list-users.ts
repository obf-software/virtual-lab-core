import { Principal } from '../../../domain/dtos/principal';
import { SeekPaginated } from '../../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../../domain/dtos/seek-pagination-input';
import { User } from '../../../domain/entities/user';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../repositories/user-repository';

export interface ListUsersInput {
    principal: Principal;
    pagination: SeekPaginationInput;
}

export type ListUsersOutput = SeekPaginated<User>;

export class ListUsers {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: ListUsersInput): Promise<ListUsersOutput> => {
        this.logger.debug('ListUsers.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const paginatedUsers = await this.userRepository.list(input.pagination);
        return paginatedUsers;
    };
}
