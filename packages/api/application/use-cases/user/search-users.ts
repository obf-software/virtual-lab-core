import { Principal } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../repositories/user-repository';

export interface SearchUsersInput {
    principal: Principal;
    textQuery: string;
}

export type SearchUsersOutput = User[];

export class SearchUsers {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: SearchUsersInput): Promise<SearchUsersOutput> => {
        this.logger.debug('SearchUsers.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const paginatedUsers = await this.userRepository.search(input.textQuery);
        return paginatedUsers;
    };
}
