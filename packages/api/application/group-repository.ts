import { SeekPaginated, SeekPaginationInput } from '../domain/dtos/seek-paginated';
import { Group } from '../domain/entities/group';

export interface GroupRepository {
    save: (group: Group) => Promise<string>;
    getById: (id: string) => Promise<Group | undefined>;
    list: (
        match: {
            createdBy?: string;
            textSearch?: string;
            userId?: string;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ) => Promise<SeekPaginated<Group>>;
    update: (group: Group) => Promise<void>;
    delete: (group: Group) => Promise<void>;
}
