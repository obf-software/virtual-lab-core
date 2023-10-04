import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { Principal } from '../../../infrastructure/auth/protocols';
import { UserRepository, schema } from '../../../infrastructure/repositories';
import { throwIfInsufficientRole } from '../../../infrastructure/auth/throw-if-insufficient-role';

export class UpdateUserRoleUseCase implements IUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    execute = async (props: {
        principal: Principal;
        userId?: string;
        role: (typeof schema.userRole.enumValues)[number];
    }) => {
        throwIfInsufficientRole('ADMIN', props.principal.role);

        const userIdAsNumber = Number(props.userId);
        let userIdToUse = props.principal.userId;

        if (props.userId !== 'me') {
            if (Number.isNaN(userIdAsNumber)) {
                throw new createHttpError.NotFound('User not found');
            }

            userIdToUse = userIdAsNumber;
        }

        const updatedUser = await this.userRepository.updateById(userIdToUse, {
            role: props.role,
        });

        if (!updatedUser) {
            throw new createHttpError.NotFound('User not found');
        }

        return updatedUser;
    };
}
