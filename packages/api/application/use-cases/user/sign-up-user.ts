import { z } from 'zod';
import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { UserRepository } from '../../user-repository';
import { Errors } from '../../../domain/dtos/errors';
import { VirtualizationGateway } from '../../virtualization-gateway';
import { useCaseExecute } from '../../../domain/decorators/use-case-execute';
import { Role } from '../../../domain/dtos/role';

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
        readonly logger: Logger,
        private readonly userRepository: UserRepository,
        private readonly virtualizationGateway: VirtualizationGateway,
    ) {}

    @useCaseExecute(signUpUserInputSchema)
    async execute(input: SignUpUserInput): Promise<SignUpUserOutput> {
        const existingUser = await this.userRepository.getByUsername(input.username);

        const role: Role = input.isExternalProvider ? 'USER' : 'PENDING';

        if (existingUser) {
            existingUser.update({
                name: input.name,
                preferredUsername: input.preferredUsername,
                role,
            });

            await this.userRepository.update(existingUser);
            return existingUser;
        }

        const instanceType = await this.virtualizationGateway.getInstanceType('t3.micro');

        if (!instanceType) {
            throw Errors.internalError('Instance type "t3.micro" not found');
        }

        const newUser = User.create({
            username: input.username,
            name: input.name,
            preferredUsername: input.preferredUsername,
            role,
            allowedInstanceTypes: [instanceType],
        });
        newUser.id = await this.userRepository.save(newUser);

        return newUser;
    }
}
