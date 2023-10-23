import { Principal } from '../../../domain/dtos/principal';
import { Role } from '../../../domain/dtos/role';
import { User } from '../../../domain/entities/user';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../repositories/user-repository';

export interface UpdateUserRoleInput {
    principal: Principal;
    userId?: number;
    role: keyof typeof Role;
}

export type UpdateUserRoleOutput = User;

export class UpdateUserRole {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: UpdateUserRoleInput): Promise<UpdateUserRoleOutput> => {
        this.logger.debug('UpdateUserRole.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const principalId = this.auth.getId(input.principal);
        const userId = input.userId ?? principalId;

        if (principalId === userId) {
            throw ApplicationError.businessRuleViolation('Cannot change your own role');
        }

        const user = await this.userRepository.getById(userId);
        if (!user) throw ApplicationError.resourceNotFound();
        user.setRole(Role[input.role]);
        await this.userRepository.update(user);
        return user;
    };
}
