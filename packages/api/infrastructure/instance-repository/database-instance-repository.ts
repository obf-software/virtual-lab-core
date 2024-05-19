import { ConfigVault } from '../../application/config-vault';
import { InstanceRepository } from '../../application/instance-repository';
import { Filter, ObjectId, Sort } from 'mongodb';
import { InstanceDbModel } from '../db/models/instance';
import { Instance } from '../../domain/entities/instance';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { MongoRepositoryAdapter } from '../adapter/mongoRepositoryAdapter';

export class DatabaseInstanceRepository
    extends MongoRepositoryAdapter
    implements InstanceRepository
{
    private readonly collectionName: string;

    constructor(deps: {
        configVault: ConfigVault;
        DATABASE_URL_PARAMETER_NAME: string;
        collectionName?: string;
    }) {
        super({
            configVault: deps.configVault,
            DATABASE_URL_PARAMETER_NAME: deps.DATABASE_URL_PARAMETER_NAME,
        });
        this.collectionName = deps.collectionName ?? 'instances';
    }

    static mapInstanceDbModelToEntity = (model: InstanceDbModel): Instance => {
        return Instance.restore({
            id: model._id.toHexString(),
            virtualId: model.virtualId,
            productId: model.productId,
            machineImageId: model.machineImageId,
            ownerId: model.ownerId.toHexString(),
            launchToken: model.launchToken,
            name: model.name,
            description: model.description,
            connectionType: model.connectionType,
            canHibernate: model.canHibernate,
            platform: model.platform,
            distribution: model.distribution,
            instanceType: model.instanceType,
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
            _id: DatabaseInstanceRepository.parseObjectId(data.id) ?? new ObjectId(),
            virtualId: data.virtualId,
            productId: data.productId,
            machineImageId: data.machineImageId,
            ownerId: DatabaseInstanceRepository.parseObjectId(data.ownerId),
            launchToken: data.launchToken,
            name: data.name,
            description: data.description,
            connectionType: data.connectionType,
            canHibernate: data.canHibernate,
            platform: data.platform,
            distribution: data.distribution,
            instanceType: data.instanceType,
            storageInGb: data.storageInGb,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastConnectionAt: data.lastConnectionAt,

            textSearch: DatabaseInstanceRepository.createTextSearchField([
                data.name,
                data.description,
                data.virtualId,
                data.productId,
                data.machineImageId,
                data.ownerId,
                data.launchToken,
                data.connectionType,
                data.platform,
                data.distribution,
                data.instanceType.name,
            ]),
        };
    };

    save = async (instance: Instance): Promise<string> => {
        const client = await this.getMongoClient();
        const newInstance = await client
            .db()
            .collection<InstanceDbModel>(this.collectionName)
            .insertOne(DatabaseInstanceRepository.mapInstanceEntityToDbModel(instance), {
                ignoreUndefined: true,
            });
        return newInstance.insertedId.toHexString();
    };

    getById = async (id: string): Promise<Instance | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>(this.collectionName)
            .findOne({ _id: new ObjectId(id) });
        if (!instance) return undefined;
        return DatabaseInstanceRepository.mapInstanceDbModelToEntity(instance);
    };

    getByVirtualId = async (virtualId: string): Promise<Instance | undefined> => {
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>(this.collectionName)
            .findOne({ virtualId: virtualId });
        if (!instance) return undefined;
        return DatabaseInstanceRepository.mapInstanceDbModelToEntity(instance);
    };

    getByLaunchToken = async (launchToken: string): Promise<Instance | undefined> => {
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>(this.collectionName)
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
            .collection<InstanceDbModel>(this.collectionName)
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
        if (match.ownerId && !ObjectId.isValid(match.ownerId)) {
            return {
                data: [],
                numberOfPages: 0,
                numberOfResults: 0,
                resultsPerPage: pagination.resultsPerPage,
            };
        }

        const client = await this.getMongoClient();

        const filter: Filter<InstanceDbModel> = {
            ownerId: DatabaseInstanceRepository.parseObjectId(match.ownerId),
            textSearch: match.textSearch
                ? { $regex: match.textSearch.toLowerCase(), $options: 'i' }
                : undefined,
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

        const collection = client.db().collection<InstanceDbModel>(this.collectionName);
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
            .collection<InstanceDbModel>(this.collectionName)
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
            .collection<InstanceDbModel>(this.collectionName)
            .deleteOne({ _id: new ObjectId(instance.id) }, { ignoreUndefined: true });
    };
}
