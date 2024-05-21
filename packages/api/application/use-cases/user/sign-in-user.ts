import { z } from 'zod';
import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';

export const signInUserInputSchema = z
    .object({
        username: z.string().min(1),
        shouldUpdateLastLoginAt: z.boolean(),
    })
    .strict();
export type SignInUserInput = z.infer<typeof signInUserInputSchema>;

export type SignInUserOutput = User;

export class SignInUser {
    constructor(
        readonly logger: Logger,
        private readonly userRepository: UserRepository,
    ) {}

    @useCaseExecute(signInUserInputSchema)
    async execute(input: SignInUserInput): Promise<SignInUserOutput> {
        const user = await this.userRepository.getByUsername(input.username);
        if (!user) throw Errors.resourceNotFound('User', input.username);

        if (input.shouldUpdateLastLoginAt) {
            user.onSignIn();
            await this.userRepository.update(user);
        }

        return user;
    }
}
