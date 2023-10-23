import { SeekPaginated } from '../../domain/dtos/seek-paginated';
import { SeekPaginationInput } from '../../domain/dtos/seek-pagination-input';
import { Instance } from '../../domain/entities/instance';

export interface InstanceRepository {
    save: (instance: Instance) => Promise<number>;
    getById: (id: number) => Promise<Instance | undefined>;
    getByLogicalId: (logicalId: string) => Promise<Instance | undefined>;
    getByProvisionToken: (provisionToken: string) => Promise<Instance | undefined>;
    listByUser: (
        userId: number,
        pagination: SeekPaginationInput,
    ) => Promise<SeekPaginated<Instance>>;
    countByUser: (userId: number) => Promise<number>;
    update: (instance: Instance) => Promise<void>;
    delete: (instance: Instance) => Promise<void>;
}
