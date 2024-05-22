import { ObjectId } from 'mongodb';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { InstanceTemplateRepository } from '../../application/instance-template-repository';
import { InstanceTemplate, InstanceTemplateData } from '../../domain/entities/instance-template';
import { randomUUID } from 'node:crypto';

export class InMemoryInstanceTemplateRepository implements InstanceTemplateRepository {
    constructor(private storage: InstanceTemplateData[] = []) {}

    addTestRecord = (data: Partial<InstanceTemplateData> = {}) => {
        const record = {
            id: data.id ?? new ObjectId().toHexString(),
            createdBy: data.createdBy ?? new ObjectId().toHexString(),
            name: data.name ?? randomUUID(),
            description: data.description ?? randomUUID(),
            productId: data.productId ?? randomUUID(),
            machineImageId: data.machineImageId ?? randomUUID(),
            platform: data.platform ?? 'LINUX',
            distribution: data.distribution ?? 'UBUNTU',
            storageInGb: data.storageInGb ?? 8,
            createdAt: data.createdAt ?? new Date(),
            updatedAt: data.updatedAt ?? new Date(),
        } satisfies InstanceTemplateData;

        this.storage.push(record);
        return record;
    };

    reset = () => {
        this.storage = [];
    };

    save = async (instanceTemplate: InstanceTemplate): Promise<string> => {
        const id = new ObjectId().toHexString();
        this.storage.push({ ...instanceTemplate.getData(), id });
        return Promise.resolve(id);
    };

    getById = async (id: string): Promise<InstanceTemplate | undefined> => {
        const instanceData = this.storage.find((instance) => instance.id === id);
        if (!instanceData) return undefined;
        return Promise.resolve(InstanceTemplate.restore({ ...instanceData, id }));
    };

    list = async (
        match: {
            createdBy: string | undefined;
            textSearch: string | undefined;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<InstanceTemplate>> => {
        const filteredInstances = this.storage.filter((f) => {
            const matchArray = [];

            if (match.createdBy) {
                matchArray.push(f.createdBy === match.createdBy);
            }

            if (match.textSearch) {
                matchArray.push(f.name.toLowerCase().includes(match.textSearch));
            }

            return matchArray.every((m) => m);
        });

        const orderedInstances = [...filteredInstances].sort((a, b) => {
            const orderMap: Record<typeof orderBy, (string | number)[]> = {
                creationDate: [a.createdAt.getTime(), b.createdAt.getTime()],
                lastUpdateDate: [a.updatedAt.getTime(), b.updatedAt.getTime()],
                alphabetical: [a.name.toLowerCase(), b.name.toLowerCase()],
            };

            const [aValue, bValue] = orderMap[orderBy];

            if (order === 'asc') {
                return aValue > bValue ? 1 : -1;
            }

            return aValue < bValue ? 1 : -1;
        });

        const paginatedInstances = orderedInstances.slice(
            pagination.resultsPerPage * (pagination.page - 1),
            pagination.resultsPerPage * pagination.page,
        );

        return Promise.resolve({
            data: paginatedInstances.map((f) => InstanceTemplate.restore({ ...f, id: f.id! })),
            numberOfResults: orderedInstances.length,
            numberOfPages: Math.ceil(orderedInstances.length / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
        });
    };

    update = async (instanceTemplate: InstanceTemplate): Promise<void> => {
        const instanceData = this.storage.find((f) => f.id === instanceTemplate.id);
        if (!instanceData) return Promise.resolve();
        this.storage = this.storage.map((f) =>
            f.id === instanceTemplate.id ? instanceTemplate.getData() : f,
        );
        return Promise.resolve();
    };

    delete = async (instanceTemplate: InstanceTemplate): Promise<void> => {
        this.storage = this.storage.filter((f) => f.id !== instanceTemplate.id);
        return Promise.resolve();
    };
}
