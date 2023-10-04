import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { GroupRepository } from '../../../infrastructure/repositories';

export class ListUserGroupsUseCase implements IUseCase {
    private groupRepository: GroupRepository;

    constructor(deps: { groupRepository: GroupRepository }) {
        this.groupRepository = deps.groupRepository;
    }

    execute = async (props: {
        principal: Principal;
        userId?: string;
        pagination: { resultsPerPage: number; page: number };
    }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        const userIdAsNumber = Number(props.userId);
        let userIdToUse = props.principal.userId;

        if (hasRoleOrAbove('ADMIN', props.principal.role) && props.userId !== 'me') {
            if (Number.isNaN(userIdAsNumber)) {
                throw new createHttpError.NotFound('User not found');
            }

            userIdToUse = userIdAsNumber;
        }

        return await this.groupRepository.listByUser(userIdToUse, props.pagination);
    };
}
