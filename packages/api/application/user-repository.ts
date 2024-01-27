import { SeekPaginated, SeekPaginationInput } from '../domain/dtos/seek-paginated';
import { User } from '../domain/entities/user';

export interface UserRepository {
    save: (user: User) => Promise<string>;
    getById: (id: string) => Promise<User | undefined>;
    getByUsername: (username: string) => Promise<User | undefined>;
    list(
        match: {
            textQuery?: string;
            groupId?: string;
        },
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<User>>;
    update(user: User): Promise<void>;
}
