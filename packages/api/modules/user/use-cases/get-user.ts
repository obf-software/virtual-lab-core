import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { hasRoleOrAbove } from '../../../infrastructure/auth/has-role-or-above';
import { Principal } from '../../../infrastructure/auth/protocols';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';
import { QuotaRepository, UserRepository } from '../../../infrastructure/repositories';

export class GetUserUseCase implements IUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly quotaRepository: QuotaRepository,
    ) {}

    execute = async (props: { principal: Principal; userId?: string }) => {
        throwIfInsufficientRole('USER', props.principal.role);

        const userIdAsNumber = Number(props.userId);
        let userIdToUse = props.principal.userId;

        if (hasRoleOrAbove('ADMIN', props.principal.role) && props.userId !== 'me') {
            if (Number.isNaN(userIdAsNumber)) {
                throw new createHttpError.NotFound('User not found');
            }

            userIdToUse = userIdAsNumber;
        }

        const [user, quota] = await Promise.all([
            this.userRepository.getById(userIdToUse),
            this.quotaRepository.getByUserId(userIdToUse),
        ]);

        if (!user || !quota) {
            throw new createHttpError.NotFound('User not found');
        }

        return { ...user, quota };
    };
}
