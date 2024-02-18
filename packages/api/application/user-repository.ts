import { SeekPaginated, SeekPaginationInput } from '../domain/dtos/seek-paginated';
import { User } from '../domain/entities/user';

export interface UserRepository {
    save(user: User): Promise<string>;
    getById(id: string): Promise<User | undefined>;
    getByUsername(username: string): Promise<User | undefined>;
    list(
        match: {
            groupId: string | undefined;
            textSearch: string | undefined;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<User>>;
    listByIds(ids: string[]): Promise<User[]>;
    update(user: User): Promise<void>;
    bulkUpdate(users: User[]): Promise<void>;
}
