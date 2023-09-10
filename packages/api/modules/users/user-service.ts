import { UserRepository } from './user-repository';
import * as schema from '../../drizzle/schema';

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

    async getRole(username: string) {
        return this.userRepository.getRole(username);
    }

    async updateLastLoginAt(username: string) {
        return this.userRepository.updateLastLoginAt(username);
    }

    async list(pagination: { resultsPerPage: number; page: number }) {
        return this.userRepository.list(pagination);
    }
}
