import { Principal } from '../../../domain/dtos/principal';
import { SeekPaginated } from '../../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../../domain/dtos/seek-pagination-input';
import { User } from '../../../domain/entities/user';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../repositories/user-repository';

export interface ListGroupUsersInput {
    principal: Principal;
    groupId: number;
    pagination: SeekPaginationInput;
}

export type ListGroupUsersOutput = SeekPaginated<User>;

export class ListGroupUsers {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: ListGroupUsersInput): Promise<ListGroupUsersOutput> => {
        this.logger.debug('ListGroupUsers.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const paginatedUsers = await this.userRepository.listByGroup(
            input.groupId,
            input.pagination,
        );
        return paginatedUsers;
    };
}
