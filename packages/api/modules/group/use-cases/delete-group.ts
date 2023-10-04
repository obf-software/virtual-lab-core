import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { Principal } from '../../../infrastructure/auth/protocols';
import { GroupRepository } from '../../../infrastructure/repositories';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';

export class DeleteGroupUseCase implements IUseCase {
    private groupRepository: GroupRepository;

    constructor(deps: { groupRepository: GroupRepository }) {
        this.groupRepository = deps.groupRepository;
    }

    execute = async (props: { principal: Principal; groupId: number }) => {
        throwIfInsufficientRole('ADMIN', props.principal.role);

        if (Number.isNaN(props.groupId)) {
            throw new createHttpError.NotFound('Group not found');
        }

        const deletedGroup = await this.groupRepository.deleteById(props.groupId);

        if (!deletedGroup) {
            throw new createHttpError.NotFound('Group not found');
        }

        return deletedGroup;
    };
}
