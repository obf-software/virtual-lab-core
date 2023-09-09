import { User, UserRole } from '@prisma/client';
import { UserRepository } from './user-repository';

export class UserService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async exists(username: string): Promise<boolean> {
        return this.userRepository.exists(username);
    }

    async create(props: Pick<User, 'username' | 'role' | 'groupIds'>): Promise<User> {
        return this.userRepository.create(props);
    }

    async getRole(username: string): Promise<UserRole | undefined> {
        return this.userRepository.getRole(username);
    }

    async updateLastLoginAt(username: string): Promise<void> {
        return this.userRepository.updateLastLoginAt(username);
    }
}
