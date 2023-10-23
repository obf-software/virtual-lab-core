import { User } from '../../../domain/entities/user';
import { Logger } from '../../logger';
import { UserRepository } from '../../repositories/user-repository';

export interface SignUpUserInput {
    username: string;
}

export type SignUpUserOutput = User;

export class SignUpUser {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: SignUpUserInput): Promise<SignUpUserOutput> => {
        this.logger.debug('SignUpUser.execute', { input });

        const existingUser = await this.userRepository.getByUsername(input.username);
        if (existingUser) return existingUser;

        const newUser = User.create(input.username);
        const newUserId = await this.userRepository.save(newUser);
        newUser.setId(newUserId);
        return newUser;
    };
}
