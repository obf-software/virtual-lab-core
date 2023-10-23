import { Principal } from '../../../domain/dtos/principal';
import { SeekPaginated } from '../../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../../domain/dtos/seek-pagination-input';
import { Group } from '../../../domain/entities/group';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface ListGroupsInput {
    principal: Principal;
    pagination: SeekPaginationInput;
}

export type ListGroupsOutput = SeekPaginated<Group>;

export class ListGroups {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: ListGroupsInput): Promise<ListGroupsOutput> => {
        this.logger.debug('ListGroups.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        return await this.groupRepository.list(input.pagination);
    };
}
