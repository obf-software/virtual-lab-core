import { Principal } from '../../../domain/dtos/principal';
import { SeekPaginated } from '../../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../../domain/dtos/seek-pagination-input';
import { Group } from '../../../domain/entities/group';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface ListUserGroupsInput {
    principal: Principal;
    userId?: number;
    pagination: SeekPaginationInput;
}

export type ListUserGroupsOutput = SeekPaginated<Group>;

export class ListUserGroups {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: ListUserGroupsInput): Promise<ListUserGroupsOutput> => {
        this.logger.debug('ListUserGroups.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'USER',
            AuthError.insufficientRole('USER'),
        );

        const principalId = this.auth.getId(input.principal);
        const userId = input.userId ?? principalId;

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && userId !== principalId) {
            throw AuthError.insufficientRole('ADMIN');
        }

        return await this.groupRepository.listByUser(userId, input.pagination);
    };

    // execute = async (props: {
    //     principal: Principal;
    //     userId?: string;
    //     pagination: { resultsPerPage: number; page: number };
    // }) => {
    //     throwIfInsufficientRole('USER', props.principal.role);

    //     const userIdAsNumber = Number(props.userId);
    //     let userIdToUse = props.principal.userId;

    //     if (hasRoleOrAbove('ADMIN', props.principal.role) && props.userId !== 'me') {
    //         if (Number.isNaN(userIdAsNumber)) {
    //             throw new createHttpError.NotFound('User not found');
    //         }

    //         userIdToUse = userIdAsNumber;
    //     }

    //     return await this.groupRepository.listByUser(userIdToUse, props.pagination);
    // };
}
