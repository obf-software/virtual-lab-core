import { UserRepository } from './repository';
import * as schema from '../../drizzle/schema';
import { UserRole } from './protocols';

export class UserService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async create(props: Pick<typeof schema.user.$inferInsert, 'username' | 'role'>) {
        const user = this.userRepository.create({
            username: props.username,
            role: props.role,
        });

        return user;
    }

    async exists(username: string): Promise<boolean> {
        return this.userRepository.exists(username);
    }

    async updateLastLoginAt(userId: number) {
        return this.userRepository.updateLastLoginAt(userId);
    }

    async getByUsername(username: string) {
        return this.userRepository.getByUsername(username);
    }

    async listUsers(pagination: { resultsPerPage: number; page: number }) {
        return this.userRepository.listUsers(pagination);
    }

    async updateRole(userId: number, role: keyof typeof UserRole) {
        return this.userRepository.updateRole(userId, role);
    }
}
