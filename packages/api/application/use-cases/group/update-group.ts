import { Principal } from '../../../domain/dtos/principal';
import { Group } from '../../../domain/entities/group';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { GroupRepository } from '../../repositories/group-repository';

export interface UpdateGroupInput {
    principal: Principal;
    groupId: number;
    name?: string;
    description?: string;
}

export type UpdateGroupOutput = Group;

export class UpdateGroup {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly groupRepository: GroupRepository,
    ) {}

    execute = async (input: UpdateGroupInput): Promise<UpdateGroupOutput> => {
        this.logger.debug('UpdateGroup.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const group = await this.groupRepository.getById(input.groupId);
        if (!group) throw ApplicationError.resourceNotFound();
        group.update({ name: input.name, description: input.description });
        await this.groupRepository.update(group);
        return group;
    };
}
