import { User } from '../../../domain/entities/user';
import { ApplicationError } from '../../../domain/errors/application-error';
import { Logger } from '../../logger';
import { UserRepository } from '../../repositories/user-repository';

export interface SignInUserInput {
    username: string;
}

export type SignInUserOutput = User;

export class SignInUser {
    constructor(
        private readonly logger: Logger,
        private readonly userRepository: UserRepository,
    ) {}

    execute = async (input: SignInUserInput): Promise<SignInUserOutput> => {
        this.logger.debug('SignInUser.execute', { input });

        const user = await this.userRepository.getByUsername(input.username);
        if (!user) throw ApplicationError.resourceNotFound();
        user.onSignIn();
        await this.userRepository.update(user);
        return user;
    };
}
