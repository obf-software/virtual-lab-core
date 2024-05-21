import { z } from 'zod';
import { principalSchema } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { Auth } from '../../auth';
import { Logger } from '../../logger';
import { roleSchema } from '../../../domain/dtos/role';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

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
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    @useCaseExecute(updateUserRoleInputSchema)
    async execute(input: UpdateUserRoleInput): Promise<UpdateUserRoleOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'ADMIN');
        const { id } = this.auth.getClaims(input.principal);
        const userId = input.userId ?? id;

        const user = await this.userRepository.getById(userId);
        if (!user) throw Errors.resourceNotFound('User', userId);

        user.update({ role: input.role });
        await this.userRepository.update(user);
        return user;
    }
}
