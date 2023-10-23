import { Principal } from '../../../domain/dtos/principal';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface LinkUsersToGroupInput {
    principal: Principal;
    groupId: number;
    userIds: number[];
}

export type LinkUsersToGroupOutput = void;

export class LinkUsersToGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: LinkUsersToGroupInput): Promise<LinkUsersToGroupOutput> => {
        this.logger.debug('LinkUsersToGroup.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        await this.groupRepository.linkUsers(input.groupId, input.userIds);
    };
}
