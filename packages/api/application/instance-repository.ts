import { SeekPaginated, SeekPaginationInput } from '../domain/dtos/seek-paginated';
import { Instance } from '../domain/entities/instance';

export interface InstanceRepository {
    save(instance: Instance): Promise<string>;
    getById(id: string): Promise<Instance | undefined>;
    getByVirtualId(virtualId: string): Promise<Instance | undefined>;
    getByLaunchToken(launchToken: string): Promise<Instance | undefined>;
    list(
        match: {
            ownerId: string | undefined;
            textSearch: string | undefined;
        },
        orderBy: 'creationDate' | 'lastConnectionDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<Instance>>;
    count(match: { ownerId?: string }): Promise<number>;
    update(instance: Instance): Promise<void>;
    delete(instance: Instance): Promise<void>;
}
