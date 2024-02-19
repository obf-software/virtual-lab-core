import { ConfigVault } from '../../application/config-vault';
import { Filter, MongoClient, ObjectId, Sort } from 'mongodb';
import { Errors } from '../../domain/dtos/errors';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { InstanceTemplateRepository } from '../../application/instance-template-repository';
import { InstanceTemplateDbModel } from '../db/models/instance-template';
import { InstanceTemplate } from '../../domain/entities/instance-template';

export class DatabaseInstanceTemplateRepository implements InstanceTemplateRepository {
    private dbClient?: MongoClient;

    constructor(
        private readonly configVault: ConfigVault,
        private readonly DATABASE_URL_PARAMETER_NAME: string,
        private readonly DATABASE_COLLECTION_NAME = 'instance-templates',
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

    static mapInstanceTemplateDbModelToEntity = (
        model: InstanceTemplateDbModel,
    ): InstanceTemplate => {
        return InstanceTemplate.restore({
            id: model._id.toJSON(),
            createdBy: model.createdBy.toJSON(),
            name: model.name,
            description: model.description,
            productId: model.productId,
            machineImageId: model.machineImageId,
            platform: model.platform,
            distribution: model.distribution,
            storageInGb: model.storageInGb,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    };

    static mapInstanceTemplateEntityToDbModel = (
        entity: InstanceTemplate,
    ): InstanceTemplateDbModel => {
        const data = entity.getData();

        return {
            _id: data.id ? new ObjectId(data.id) : new ObjectId(),
            createdBy: new ObjectId(data.createdBy),
            name: data.name,
            description: data.description,
            productId: data.productId,
            machineImageId: data.machineImageId,
            platform: data.platform,
            distribution: data.distribution,
            storageInGb: data.storageInGb,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,

            textSearch: [
                data.name,
                data.description,
                data.productId,
                data.machineImageId,
                data.platform,
                data.distribution,
            ]
                .filter((x): x is string => typeof x === 'string')
                .map((x) => x.toLowerCase())
                .join(' '),
        };
    };

    save = async (instanceTemplate: InstanceTemplate): Promise<string> => {
        const client = await this.getMongoClient();
        const newInstance = await client
            .db()
            .collection<InstanceTemplateDbModel>(this.DATABASE_COLLECTION_NAME)
            .insertOne(
                DatabaseInstanceTemplateRepository.mapInstanceTemplateEntityToDbModel(
                    instanceTemplate,
                ),
                {
                    ignoreUndefined: true,
                },
            );
        return newInstance.insertedId.toJSON();
    };

    getById = async (id: string): Promise<InstanceTemplate | undefined> => {
        if (!ObjectId.isValid(id)) return Promise.resolve(undefined);
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceTemplateDbModel>(this.DATABASE_COLLECTION_NAME)
            .findOne({ _id: new ObjectId(id) });
        if (!instance) return undefined;
        return DatabaseInstanceTemplateRepository.mapInstanceTemplateDbModelToEntity(instance);
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
        if (match.createdBy && !ObjectId.isValid(match.createdBy)) {
            return {
                data: [],
                numberOfPages: 0,
                numberOfResults: 0,
                resultsPerPage: pagination.resultsPerPage,
            };
        }

        const client = await this.getMongoClient();

        const filter: Filter<InstanceTemplateDbModel> = {
            createdBy: match.createdBy ? new ObjectId(match.createdBy) : undefined,
            textSearch: match.textSearch ? { $regex: match.textSearch, $options: 'i' } : undefined,
        };

        const sortOrder = order === 'asc' ? 1 : -1;
        const sortMap: Record<typeof orderBy, Sort> = {
            creationDate: {
                _id: sortOrder,
            },
            lastUpdateDate: {
                updatedAt: sortOrder,
                _id: sortOrder,
            },
            alphabetical: {
                textSearch: sortOrder,
                _id: sortOrder,
            },
        };

        const collection = client
            .db()
            .collection<InstanceTemplateDbModel>(this.DATABASE_COLLECTION_NAME);
        const [count, instanceTemplates] = await Promise.all([
            collection.countDocuments(filter, { ignoreUndefined: true }),
            collection
                .find(filter, { ignoreUndefined: true })
                .sort(sortMap[orderBy])
                .skip(pagination.resultsPerPage * (pagination.page - 1))
                .limit(pagination.resultsPerPage)
                .toArray(),
        ]);

        return {
            data: instanceTemplates.map(
                DatabaseInstanceTemplateRepository.mapInstanceTemplateDbModelToEntity,
            ),
            numberOfPages: Math.ceil(count / pagination.resultsPerPage),
            numberOfResults: count,
            resultsPerPage: pagination.resultsPerPage,
        };
    };

    update = async (instanceTemplate: InstanceTemplate): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<InstanceTemplateDbModel>(this.DATABASE_COLLECTION_NAME)
            .updateOne(
                { _id: new ObjectId(instanceTemplate.id) },
                {
                    $set: DatabaseInstanceTemplateRepository.mapInstanceTemplateEntityToDbModel(
                        instanceTemplate,
                    ),
                },
                { ignoreUndefined: true, upsert: false },
            );
    };

    delete = async (instanceTemplate: InstanceTemplate): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<InstanceTemplateDbModel>(this.DATABASE_COLLECTION_NAME)
            .deleteOne({ _id: new ObjectId(instanceTemplate.id) }, { ignoreUndefined: true });
    };
}
