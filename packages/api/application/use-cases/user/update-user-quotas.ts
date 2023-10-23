import { Principal } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { ApplicationError } from '../../../domain/errors/application-error';
import { AuthError } from '../../../domain/errors/auth-error';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { UserRepository } from '../../repositories/user-repository';

export interface UpdateUserQuotasInput {
    principal: Principal;
    userId?: number;
    maxInstances: number;
}

export type UpdateUserQuotasOutput = User;

export class UpdateUserQuotas {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: UpdateUserQuotasInput): Promise<UpdateUserQuotasOutput> => {
        this.logger.debug('UpdateUserQuotas.execute', { input });

        this.auth.assertThatHasRoleOrAbove(
            input.principal,
            'ADMIN',
            AuthError.insufficientRole('ADMIN'),
        );

        const principalId = this.auth.getId(input.principal);
        const userId = input.userId ?? principalId;

        const user = await this.userRepository.getById(userId);
        if (!user) throw ApplicationError.resourceNotFound();
        user.setQuotas(input.maxInstances);
        await this.userRepository.update(user);
        return user;
    };
}
