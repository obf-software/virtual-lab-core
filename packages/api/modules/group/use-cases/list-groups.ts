import { IUseCase } from '../../../domain/interfaces';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { GroupRepository } from '../../../infrastructure/repositories';

export class ListGroupsUseCase implements IUseCase {
    private groupRepository: GroupRepository;

    constructor(deps: { groupRepository: GroupRepository }) {
        this.groupRepository = deps.groupRepository;
    }

    execute = async (props: {
        principal: Principal;
        pagination: { resultsPerPage: number; page: number };
    }) => {
        throwIfInsufficientRole('ADMIN', props.principal.role);
        return await this.groupRepository.list(props.pagination);
    };
}
