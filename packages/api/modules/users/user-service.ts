import { UserRepository } from './user-repository';
import * as schema from '../../drizzle/schema';
import { UserRole } from './protocols';

export class UserService {
    private userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async exists(username: string): Promise<boolean> {
        return this.userRepository.exists(username);
    }

    async create(props: Pick<typeof schema.user.$inferInsert, 'username' | 'role'>) {
        const user = this.userRepository.create({
            username: props.username,
            role: props.role,
        });

        return user;
    }

    async getByUsername(username: string) {
        return this.userRepository.getByUsername(username);
    }

    async updateLastLoginAt(userId: number) {
        return this.userRepository.updateLastLoginAt(userId);
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
        return this.userRepository.list(pagination);
    }

    /**
     * @deprecated Use listGroups instead from groups module
     */
    async listGroups(userId: number, pagination: { resultsPerPage: number; page: number }) {
        return this.userRepository.listGroups(userId, pagination);
    }

    async updateRole(userId: number, role: keyof typeof UserRole) {
        return this.userRepository.updateRole(userId, role);
    }
}
