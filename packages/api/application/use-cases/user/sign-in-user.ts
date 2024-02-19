import { z } from 'zod';
import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';

export const signInUserInputSchema = z
    .object({
        username: z.string().min(1),
    })
    .strict();
export type SignInUserInput = z.infer<typeof signInUserInputSchema>;

export type SignInUserOutput = User;

export class SignInUser {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: SignInUserInput): Promise<SignInUserOutput> => {
        this.logger.debug('SignInUser.execute', { input });

        const inputValidation = signInUserInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        const user = await this.userRepository.getByUsername(validInput.username);
        if (!user) throw Errors.resourceNotFound('User', validInput.username);
        user.onSignIn();
        await this.userRepository.update(user);
        return user;
    };
}
