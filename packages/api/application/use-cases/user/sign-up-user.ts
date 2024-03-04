import { z } from 'zod';
import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';
import { VirtualizationGateway } from '../../virtualization-gateway';

export const signUpUserInputSchema = z
    .object({
        username: z.string().min(1),
        name: z.string().optional(),
        preferredUsername: z.string().optional(),
        isExternalProvider: z.boolean(),
    })
    .strict();
export type SignUpUserInput = z.infer<typeof signUpUserInputSchema>;

export type SignUpUserOutput = User;

export class SignUpUser {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    execute = async (input: SignUpUserInput): Promise<SignUpUserOutput> => {
        this.logger.debug('SignUpUser.execute', { input });

        const inputValidation = signUpUserInputSchema.safeParse(input);
        if (!inputValidation.success) throw Errors.validationError(inputValidation.error);
        const { data: validInput } = inputValidation;

        const existingUser = await this.userRepository.getByUsername(validInput.username);

        if (existingUser) {
            existingUser.update({
                name: validInput.name,
                preferredUsername: validInput.preferredUsername,
                role: validInput.isExternalProvider ? 'USER' : 'PENDING',
            });

            await this.userRepository.update(existingUser);
            return existingUser;
        }

        const instanceType = await this.virtualizationGateway.getInstanceType('t3.micro');

        if (!instanceType) {
            throw Errors.internalError('Instance type "t3.micro" not found');
        }

        const newUser = User.create({
            username: validInput.username,
            name: validInput.name,
            preferredUsername: validInput.preferredUsername,
            role: validInput.isExternalProvider ? 'USER' : 'PENDING',
            allowedInstanceTypes: [instanceType],
        });
        newUser.id = await this.userRepository.save(newUser);

        return newUser;
    };
}
