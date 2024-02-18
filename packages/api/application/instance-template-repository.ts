import { SeekPaginated, SeekPaginationInput } from '../domain/dtos/seek-paginated';
import { InstanceTemplate } from '../domain/entities/instance-template';

export interface InstanceTemplateRepository {
    save(instanceTemplate: InstanceTemplate): Promise<string>;
    getById(id: string): Promise<InstanceTemplate | undefined>;
    list(
        match: {
            createdBy: string | undefined;
            textSearch: string | undefined;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<InstanceTemplate>>;
    update(instanceTemplate: InstanceTemplate): Promise<void>;
    delete(instanceTemplate: InstanceTemplate): Promise<void>;
}
