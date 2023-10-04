import createHttpError from 'http-errors';
import { IUseCase } from '../../../domain/interfaces';
import { UserRepository } from '../../../infrastructure/repositories/user-repository';
import dayjs from 'dayjs';

export class SignInUseCase implements IUseCase {
    constructor(private readonly userRepository: UserRepository) {}

    execute = async (username: string) => {
        const user = await this.userRepository.updateByUsername(username, {
            lastLoginAt: dayjs.utc().toDate(),
        });

        if (user === undefined) {
            throw new createHttpError.NotFound(`User with username ${username} not found`);
        }

        return user;
    };
}
