import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { QuotaRepository, UserRepository } from '../../../infrastructure/repositories';

export class SignUpUseCase implements IUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly quotaRepository: QuotaRepository,
    ) {}

    execute = async (username: string) => {
        const existingUser = await this.userRepository.getByUsername(username);
        if (existingUser) return existingUser;

        const newUser = await this.userRepository.create({ username, role: 'PENDING' });

        if (!newUser) {
            throw new createHttpError.InternalServerError('Failed to create user');
        }

        await this.quotaRepository.create({ userId: newUser.id, maxInstances: 5 });
        return newUser;
    };
}
