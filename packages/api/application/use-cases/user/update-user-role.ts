import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { roleSchema } from '../../../domain/dtos/role';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';

export const updateUserRoleInputSchema = z
    .object({
        principal: principalSchema,
        userId: z.string().min(1).optional(),
        role: roleSchema.extract(['ADMIN', 'USER', 'NONE']),
    })
    .strict();
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;

export type UpdateUserRoleOutput = User;

export class UpdateUserRole {
    constructor(
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: UpdateUserRoleInput): Promise<UpdateUserRoleOutput> => {
        this.logger.debug('UpdateUserRole.execute', { input });

        const inputValidation = updateUserRoleInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'ADMIN');
        const { id } = this.auth.getClaims(validInput.principal);
        const userId = validInput.userId ?? id;

        const user = await this.userRepository.getById(userId);
        if (!user) throw Errors.resourceNotFound('User', userId);

        user.update({ role: validInput.role });
        await this.userRepository.update(user);
        return user;
    };
}
