import { SeekPaginated } from '../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../domain/dtos/seek-pagination-input';
import { User } from '../../domain/entities/user';

export interface UserRepository {
    save: (user: User) => Promise<number>;
    getById: (id: number) => Promise<User | undefined>;
    getByUsername: (username: string) => Promise<User | undefined>;
    list(pagination: SeekPaginationInput): Promise<SeekPaginated<User>>;
    listByGroup(groupId: number, pagination: SeekPaginationInput): Promise<SeekPaginated<User>>;
    update(user: User): Promise<void>;
}
