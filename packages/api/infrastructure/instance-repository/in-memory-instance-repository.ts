import { InstanceRepository } from '../../application/instance-repository';
import { ObjectId } from 'mongodb';
import { Instance, InstanceData } from '../../domain/entities/instance';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { randomUUID } from 'node:crypto';

export class DatabaseInstanceRepository implements InstanceRepository {
    constructor(private storage: InstanceData[] = []) {}

    addTestRecord = (data: Partial<InstanceData> = {}) => {
        const record: InstanceData = {
            id: data.id ?? new ObjectId().toHexString(),
            canHibernate: data.canHibernate ?? false,
            createdAt: data.createdAt ?? new Date(),
            description: data.description ?? randomUUID(),
            lastConnectionAt: data.lastConnectionAt ?? undefined,
            launchToken: data.launchToken ?? randomUUID(),
            name: data.name ?? randomUUID(),
            ownerId: data.ownerId ?? new ObjectId().toHexString(),
            platform: data.platform ?? 'LINUX',
            distribution: data.distribution ?? 'UBUNTU',
            machineImageId: data.machineImageId ?? randomUUID(),
            state: data.state ?? 'STOPPED',
            productId: data.productId ?? randomUUID(),
            storageInGb: data.storageInGb ?? '8',
            virtualId: data.virtualId ?? randomUUID(),
            updatedAt: data.updatedAt ?? new Date(),
            connectionType: data.connectionType ?? 'RDP',
            instanceType: data.instanceType ?? {
                cpu: {
                    clockSpeedInGhz: 5,
                    cores: 1,
                    manufacturer: '',
                    threadsPerCore: 1,
                    vCpus: 1,
                },
                gpu: {
                    devices: [],
                    totalGpuMemoryInMb: 0,
                },
                hibernationSupport: false,
                name: randomUUID(),
                networkPerformance: 'Up to 5Ghz',
                ram: {
                    sizeInMb: 512,
                },
            },
        };

        this.storage.push(record);
        return record;
    };

    save = async (instance: Instance): Promise<string> => {
        const id = new ObjectId().toHexString();
        this.storage.push({ ...instance.getData(), id });
        return Promise.resolve(id);
    };

    getById = async (id: string): Promise<Instance | undefined> => {
        const instanceData = this.storage.find((instance) => instance.id === id);
        if (!instanceData) return undefined;
        return Promise.resolve(Instance.restore({ ...instanceData, id }));
    };

    getByVirtualId = async (virtualId: string): Promise<Instance | undefined> => {
        const instanceData = this.storage.find((instance) => instance.virtualId === virtualId);
        if (!instanceData) return undefined;
        return Promise.resolve(Instance.restore({ ...instanceData, id: instanceData.id! }));
    };

    getByLaunchToken = async (launchToken: string): Promise<Instance | undefined> => {
        const instanceData = this.storage.find((instance) => instance.launchToken === launchToken);
        if (!instanceData) return undefined;
        return Promise.resolve(Instance.restore({ ...instanceData, id: instanceData.id! }));
    };

    count = async (match: { ownerId?: string | undefined }): Promise<number> => {
        const filteredInstances = this.storage.filter((f) => {
            const matchArray = [];

            if (match.ownerId) {
                matchArray.push(f.ownerId === match.ownerId);
            }

            return matchArray.every((m) => m);
        });

        return Promise.resolve(filteredInstances.length);
    };

    list = async (
        match: {
            ownerId?: string;
            textSearch?: string;
        },
        orderBy: 'creationDate' | 'lastConnectionDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<Instance>> => {
        const filteredInstances = this.storage.filter((f) => {
            const matchArray = [];

            if (match.ownerId) {
                matchArray.push(f.ownerId === match.ownerId);
            }

            if (match.textSearch) {
                matchArray.push(f.name.toLowerCase().includes(match.textSearch));
            }

            return matchArray.every((m) => m);
        });

        const orderedInstances = [...filteredInstances].sort((a, b) => {
            const orderMap: Record<typeof orderBy, (string | number)[]> = {
                creationDate: [a.createdAt.getTime(), b.createdAt.getTime()],
                lastConnectionDate: [
                    a.lastConnectionAt?.getTime() ?? 0,
                    b.lastConnectionAt?.getTime() ?? 0,
                ],
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
            data: paginatedInstances.map((f) => Instance.restore({ ...f, id: f.id! })),
            numberOfResults: orderedInstances.length,
            numberOfPages: Math.ceil(orderedInstances.length / pagination.resultsPerPage),
            resultsPerPage: pagination.resultsPerPage,
        });
    };

    update = async (instance: Instance): Promise<void> => {
        const instanceData = this.storage.find((f) => f.id === instance.id);
        if (!instanceData) return Promise.resolve();
        this.storage = this.storage.map((f) => (f.id === instance.id ? instance.getData() : f));
        return Promise.resolve();
    };

    delete = async (instance: Instance): Promise<void> => {
        this.storage = this.storage.filter((f) => f.id !== instance.id);
        return Promise.resolve();
    };
}
