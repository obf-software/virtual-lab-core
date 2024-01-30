import { ConfigVault } from '../../application/config-vault';
import { InstanceRepository } from '../../application/instance-repository';
import { Filter, MongoClient, ObjectId, Sort } from 'mongodb';
import { Errors } from '../../domain/dtos/errors';
import { InstanceDbModel } from '../db/models/instance';
import { Instance } from '../../domain/entities/instance';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';

export class DatabaseInstanceRepository implements InstanceRepository {
    private databaseUrl?: string;

    constructor(
        private readonly configVault: ConfigVault,
        private readonly DATABASE_URL_PARAMETER_NAME: string,
    ) {}

    private async getMongoClient(): Promise<MongoClient> {
        if (this.databaseUrl) {
            return new MongoClient(this.databaseUrl);
        }

        const retrievedDatabaseUrl = await this.configVault.getParameter(
            this.DATABASE_URL_PARAMETER_NAME,
        );
        if (retrievedDatabaseUrl === undefined) {
            throw Errors.internalError(
                `Failed to retrieve ${this.DATABASE_URL_PARAMETER_NAME} from config vault`,
            );
        }

        this.databaseUrl = retrievedDatabaseUrl;
        return new MongoClient(retrievedDatabaseUrl);
    }

    static mapInstanceDbModelToEntity = (model: InstanceDbModel): Instance => {
        return Instance.restore({
            ...model,
            id: model._id.toJSON(),
            ownerId: model.ownerId.toJSON(),
        });
    };

    static mapInstanceEntityToDbModel = (entity: Instance): InstanceDbModel => {
        const { id, ownerId, ...rest } = entity.getData();

        return {
            ...rest,
            _id: id ? new ObjectId(id) : new ObjectId(),
            ownerId: new ObjectId(ownerId),
        };
    };

    save = async (instance: Instance): Promise<string> => {
        const client = await this.getMongoClient();
        const newInstance = await client
            .db()
            .collection<InstanceDbModel>('instances')
            .insertOne(DatabaseInstanceRepository.mapInstanceEntityToDbModel(instance), {
                ignoreUndefined: true,
            });
        await client.close();
        return newInstance.insertedId.toJSON();
    };

    getById = async (id: string): Promise<Instance | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>('instances')
            .findOne({ _id: new ObjectId(id) });
        await client.close();
        if (!instance) return undefined;
        return DatabaseInstanceRepository.mapInstanceDbModelToEntity(instance);
    };

    getByVirtualId = async (virtualId: string): Promise<Instance | undefined> => {
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>('instances')
            .findOne({ virtualId: virtualId });
        await client.close();
        if (!instance) return undefined;
        return DatabaseInstanceRepository.mapInstanceDbModelToEntity(instance);
    };

    getByLaunchToken = async (launchToken: string): Promise<Instance | undefined> => {
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceDbModel>('instances')
            .findOne({ launchToken: launchToken });
        await client.close();
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
            .collection<InstanceDbModel>('instances')
            .countDocuments(filter, { ignoreUndefined: true });
        await client.close();
        return count;
    };

    list = async (
        match: {
            ownerId?: string;
        },
        orderBy: 'creationDate' | 'lastConnectionDate' | 'name',
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
            name: {
                name: sortOrder,
                _id: sortOrder,
            },
        };

        const collection = client.db().collection<InstanceDbModel>('instances');
        const [count, instances] = await Promise.all([
            collection.countDocuments(filter, { ignoreUndefined: true }),
            collection
                .find(filter, { ignoreUndefined: true })
                .collation({ locale: 'en', strength: 2 })
                .sort(sortMap[orderBy])
                .skip(pagination.page * (pagination.resultsPerPage - 1))
                .limit(pagination.resultsPerPage)
                .toArray(),
        ]);
        await client.close();

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
            .collection<InstanceDbModel>('instances')
            .updateOne(
                { _id: new ObjectId(instance.id) },
                { $set: DatabaseInstanceRepository.mapInstanceEntityToDbModel(instance) },
                { ignoreUndefined: true, upsert: false },
            );
        await client.close();
    };

    delete = async (instance: Instance): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<InstanceDbModel>('instances')
            .deleteOne({ _id: new ObjectId(instance.id) }, { ignoreUndefined: true });
        await client.close();
    };
}
