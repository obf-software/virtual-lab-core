import { Principal } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { UserRepository } from '../../repositories/user-repository';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { AuthError } from '../../../domain/errors/auth-error';
import { ApplicationError } from '../../../domain/errors/application-error';

export interface GetUserInput {
    principal: Principal;
    userId?: number;
}

export type GetUserOutput = User;

export class GetUser {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: GetUserInput): Promise<GetUserOutput> => {
        this.logger.debug('GetUser.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'PENDING',
            AuthError.insufficientRole('PENDING'),
        );

        const principalId = this.auth.getId(input.principal);
        const userId = input.userId ?? principalId;

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && userId !== principalId) {
            throw AuthError.insufficientRole('ADMIN');
        }

        const user = await this.userRepository.getById(userId);
        if (!user) throw ApplicationError.resourceNotFound();
        return user;
    };
}
