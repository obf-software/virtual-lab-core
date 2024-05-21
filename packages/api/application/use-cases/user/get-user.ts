import { principalSchema } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { z } from 'zod';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const getUserInputSchema = z
    .object({
        principal: principalSchema,
        userId: z.string().min(1).optional(),
    })
    .strict();
export type GetUserInput = z.infer<typeof getUserInputSchema>;

export type GetUserOutput = User;

export class GetUser {
    constructor(
        readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    @useCaseExecute(getUserInputSchema)
    async execute(input: GetUserInput): Promise<GetUserOutput> {
        this.auth.assertThatHasRoleOrAbove(input.principal, 'PENDING');
        const { id } = this.auth.getClaims(input.principal);

        const userId = input.userId ?? id;

        if (!this.auth.hasRoleOrAbove(input.principal, 'ADMIN') && userId !== id) {
            throw Errors.insufficientRole('ADMIN');
        }

        const user = await this.userRepository.getById(userId);
        if (!user) throw Errors.resourceNotFound('User', userId);
        return user;
    }
}
