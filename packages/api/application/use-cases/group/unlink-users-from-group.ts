import { Principal } from '../../../domain/dtos/principal';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface UnlinkUsersFromGroupInput {
    principal: Principal;
    groupId: number;
    userIds: number[];
}

export type UnlinkUsersFromGroupOutput = void;

export class UnlinkUsersFromGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: UnlinkUsersFromGroupInput): Promise<UnlinkUsersFromGroupOutput> => {
        this.logger.debug('UnlinkUsersFromGroup.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        await this.groupRepository.unlinkUsers(input.groupId, input.userIds);
    };
}
