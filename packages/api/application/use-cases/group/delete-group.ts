import { Principal } from '../../../domain/dtos/principal';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface DeleteGroupInput {
    principal: Principal;
    groupId: number;
}

export type DeleteGroupOutput = void;

export class DeleteGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: DeleteGroupInput): Promise<DeleteGroupOutput> => {
        this.logger.debug('DeleteGroup.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const group = await this.groupRepository.getById(input.groupId);
        if (!group) throw ApplicationError.resourceNotFound();
        await this.groupRepository.delete(group);
    };

    // execute = async (props: { principal: Principal; groupId: number }) => {
    //     throwIfInsufficientRole('ADMIN', props.principal.role);

    //     if (Number.isNaN(props.groupId)) {
    //         throw new createHttpError.NotFound('Group not found');
    //     }

    //     const deletedGroup = await this.groupRepository.deleteById(props.groupId);

    //     if (!deletedGroup) {
    //         throw new createHttpError.NotFound('Group not found');
    //     }

    //     return deletedGroup;
    // };
}
