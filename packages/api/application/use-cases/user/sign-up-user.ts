import { z } from 'zod';
import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';

export const signUpUserInputSchema = z
    .object({
        username: z.string().min(1),
        selfRegister: z.boolean().optional().default(false),
    })
    .strict();
export type SignUpUserInput = z.infer<typeof signUpUserInputSchema>;

export type SignUpUserOutput = User;

export class SignUpUser {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: SignUpUserInput): Promise<SignUpUserOutput> => {
        this.logger.debug('SignUpUser.execute', { input });

        const inputValidation = signUpUserInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        const existingUser = await this.userRepository.getByUsername(validInput.username);
        if (existingUser) return existingUser;

        const newUser = User.create({
            username: validInput.username,
            role: validInput.selfRegister ? 'PENDING' : 'USER',
        });
        newUser.id = await this.userRepository.save(newUser);
        return newUser;
    };
}
