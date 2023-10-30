import { Principal } from '../../../domain/dtos/principal';
import { Group } from '../../../domain/entities/group';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface SearchGroupsInput {
    principal: Principal;
    textQuery: string;
}

export type SearchGroupsOutput = Group[];

export class SearchGroups {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: SearchGroupsInput): Promise<SearchGroupsOutput> => {
        this.logger.debug('SearchGroups.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        return await this.groupRepository.search(input.textQuery);
    };
}
