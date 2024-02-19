import { principalSchema } from '../../../domain/dtos/principal';
import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { Auth } from '../../auth';
import { z } from 'zod';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';

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
        private readonly logger: Logger,
        private readonly auth: Auth,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: GetUserInput): Promise<GetUserOutput> => {
        this.logger.debug('GetUser.execute', { input });

        const inputValidation = getUserInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        this.auth.assertThatHasRoleOrAbove(validInput.principal, 'PENDING');
        const { id } = this.auth.getClaims(validInput.principal);

        const userId = validInput.userId ?? id;

        if (!this.auth.hasRoleOrAbove(validInput.principal, 'ADMIN') && userId !== id) {
            throw Errors.insufficientRole('ADMIN');
        }

        const user = await this.userRepository.getById(userId);
        if (!user) throw Errors.resourceNotFound('User', userId);
        return user;
    };
}
