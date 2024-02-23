import { ConfigVault } from '../../application/config-vault';
import { InstanceRepository } from '../../application/instance-repository';
import { Filter, MongoClient, ObjectId, Sort } from 'mongodb';
import { Errors } from '../../domain/dtos/errors';
import { InstanceDbModel } from '../db/models/instance';
import { Instance } from '../../domain/entities/instance';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';

export class DatabaseInstanceRepository implements InstanceRepository {
    private dbClient?: MongoClient;

    constructor(
        private readonly configVault: ConfigVault,
        private readonly DATABASE_URL_PARAMETER_NAME: string,
        private readonly DATABASE_COLLECTION_NAME = 'instances',
    ) {}

    private async getMongoClient(): Promise<MongoClient> {
        if (this.dbClient) return this.dbClient;

        const retrievedDatabaseUrl = await this.configVault.getParameter(
            this.DATABASE_URL_PARAMETER_NAME,
        );
        if (!retrievedDatabaseUrl) {
            throw Errors.internalError(`Ivalid "${this.DATABASE_URL_PARAMETER_NAME}" parameter`);
        }

        const newDbClient = new MongoClient(retrievedDatabaseUrl);
        this.dbClient = newDbClient;
        return newDbClient;
    }

    static mapInstanceDbModelToEntity = (model: InstanceDbModel): Instance => {
        return Instance.restore({
            id: model._id.toJSON(),
            virtualId: model.virtualId,
            productId: model.productId,
            machineImageId: model.machineImageId,
            ownerId: model.ownerId.toJSON(),
            launchToken: model.launchToken,
            name: model.name,
            description: model.description,
            connectionType: model.connectionType,
            canHibernate: model.canHibernate,
            platform: model.platform,
            distribution: model.distribution,
            instanceType: model.instanceType,
            cpuCores: model.cpuCores,
            memoryInGb: model.memoryInGb,
            storageInGb: model.storageInGb,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            lastConnectionAt: model.lastConnectionAt,
            state: undefined,
        });
    };

    static mapInstanceEntityToDbModel = (entity: Instance): InstanceDbModel => {
        const data = entity.getData();

        return {
            _id: data.id ? new ObjectId(data.id) : new ObjectId(),
            virtualId: data.virtualId,
            productId: data.productId,
            machineImageId: data.machineImageId,
            ownerId: new ObjectId(data.ownerId),
            launchToken: data.launchToken,
            name: data.name,
            description: data.description,
            connectionType: data.connectionType,
            canHibernate: data.canHibernate,
            platform: data.platform,
            distribution: data.distribution,
            instanceType: data.instanceType,
            cpuCores: data.cpuCores,
            memoryInGb: data.memoryInGb,
            storageInGb: data.storageInGb,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastConnectionAt: data.lastConnectionAt,

            textSearch: [data.name, data.description]
                .filter((x): x is string => typeof x === 'string')
                .map((x) => x.toLowerCase())
                .join(' '),
        };
    };

    save = async (instance: Instance): Promise<string> => {
        const client = await this.getMongoClient();
        const newInstance = await client
            .db()
            .collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME)
            .insertOne(DatabaseInstanceRepository.mapInstanceEntityToDbModel(instance), {
                ignoreUndefined: true,
            });
        return newInstance.insertedId.toJSON();
    };

    getById = async (id: string): Promise<Instance | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME)
            .findOne({ _id: new ObjectId(id) });
        if (!instance) return undefined;
        return DatabaseInstanceRepository.mapInstanceDbModelToEntity(instance);
    };

    getByVirtualId = async (virtualId: string): Promise<Instance | undefined> => {
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME)
            .findOne({ virtualId: virtualId });
        if (!instance) return undefined;
        return DatabaseInstanceRepository.mapInstanceDbModelToEntity(instance);
    };

    getByLaunchToken = async (launchToken: string): Promise<Instance | undefined> => {
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME)
            .findOne({ launchToken: launchToken });
        if (!instance) return undefined;
        return DatabaseInstanceRepository.mapInstanceDbModelToEntity(instance);
    };

    count = async (match: { ownerId?: string | undefined }): Promise<number> => {
        const filter: Filter<InstanceDbModel> = {
            ownerId: match.ownerId ? new ObjectId(match.ownerId) : undefined,
        };

        const client = await this.getMongoClient();
        const count = await client
            .db()
            .collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME)
            .countDocuments(filter, { ignoreUndefined: true });
        return count;
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
        if (!!match.ownerId && !ObjectId.isValid(match.ownerId)) {
            return {
                data: [],
                numberOfPages: 0,
                numberOfResults: 0,
                resultsPerPage: pagination.resultsPerPage,
            };
        }

        const client = await this.getMongoClient();

        const filter: Filter<InstanceDbModel> = {
            ownerId: match.ownerId ? new ObjectId(match.ownerId) : undefined,
            textSearch: match.textSearch ? { $regex: match.textSearch, $options: 'i' } : undefined,
        };

        const sortOrder = order === 'asc' ? 1 : -1;
        const sortMap: Record<typeof orderBy, Sort> = {
            creationDate: {
                _id: sortOrder,
            },
            lastConnectionDate: {
                lastConnectionAt: sortOrder,
                _id: sortOrder,
            },
            alphabetical: {
                textSearch: sortOrder,
                _id: sortOrder,
            },
        };

        const collection = client.db().collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME);
        const [count, instances] = await Promise.all([
            collection.countDocuments(filter, { ignoreUndefined: true }),
            collection
                .find(filter, { ignoreUndefined: true })
                .sort(sortMap[orderBy])
                .skip(pagination.resultsPerPage * (pagination.page - 1))
                .limit(pagination.resultsPerPage)
                .toArray(),
        ]);

        return {
            data: instances.map(DatabaseInstanceRepository.mapInstanceDbModelToEntity),
            numberOfPages: Math.ceil(count / pagination.resultsPerPage),
            numberOfResults: count,
            resultsPerPage: pagination.resultsPerPage,
        };
    };

    update = async (instance: Instance): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME)
            .updateOne(
                { _id: new ObjectId(instance.id) },
                { $set: DatabaseInstanceRepository.mapInstanceEntityToDbModel(instance) },
                { ignoreUndefined: true, upsert: false },
            );
    };

    delete = async (instance: Instance): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<InstanceDbModel>(this.DATABASE_COLLECTION_NAME)
            .deleteOne({ _id: new ObjectId(instance.id) }, { ignoreUndefined: true });
    };
}
