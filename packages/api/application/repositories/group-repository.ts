import { SeekPaginated } from '../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../domain/dtos/seek-pagination-input';
import { Group } from '../../domain/entities/group';

export interface GroupRepository {
    save: (group: Group) => Promise<number>;
    getById: (id: number) => Promise<Group | undefined>;
    list: (pagination: SeekPaginationInput) => Promise<SeekPaginated<Group>>;
    listByUser: (userId: number, pagination: SeekPaginationInput) => Promise<SeekPaginated<Group>>;
    search: (textQuery: string) => Promise<Group[]>;
    listGroupPortfolioIdsByUser: (userId: number) => Promise<string[]>;
    update: (group: Group) => Promise<void>;
    delete: (group: Group) => Promise<void>;
    linkUsers: (groupId: number, userIds: number[]) => Promise<void>;
    unlinkUsers: (groupId: number, userIds: number[]) => Promise<void>;
}
