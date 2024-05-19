import { ConfigVault } from '../../application/config-vault';
import { Filter, ObjectId, Sort } from 'mongodb';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { InstanceTemplateRepository } from '../../application/instance-template-repository';
import { InstanceTemplateDbModel } from '../db/models/instance-template';
import { InstanceTemplate } from '../../domain/entities/instance-template';
import { MongoRepositoryAdapter } from '../adapter/mongoRepositoryAdapter';

export class DatabaseInstanceTemplateRepository
    extends MongoRepositoryAdapter
    implements InstanceTemplateRepository
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
        this.collectionName = deps.collectionName ?? 'instance-templates';
    }

    static mapInstanceTemplateDbModelToEntity = (
        model: InstanceTemplateDbModel,
    ): InstanceTemplate => {
        return InstanceTemplate.restore({
            id: model._id.toHexString(),
            createdBy: model.createdBy.toHexString(),
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
            _id: DatabaseInstanceTemplateRepository.parseObjectId(data.id) ?? new ObjectId(),
            createdBy: DatabaseInstanceTemplateRepository.parseObjectId(data.createdBy),
            name: data.name,
            description: data.description,
            productId: data.productId,
            machineImageId: data.machineImageId,
            platform: data.platform,
            distribution: data.distribution,
            storageInGb: data.storageInGb,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,

            textSearch: DatabaseInstanceTemplateRepository.createTextSearchField([
                data.name,
                data.description,
                data.productId,
                data.machineImageId,
                data.platform,
                data.distribution,
            ]),
        };
    };

    save = async (instanceTemplate: InstanceTemplate): Promise<string> => {
        const client = await this.getMongoClient();
        const newInstance = await client
            .db()
            .collection<InstanceTemplateDbModel>(this.collectionName)
            .insertOne(
                DatabaseInstanceTemplateRepository.mapInstanceTemplateEntityToDbModel(
                    instanceTemplate,
                ),
                { ignoreUndefined: true },
            );
        return newInstance.insertedId.toHexString();
    };

    getById = async (id: string): Promise<InstanceTemplate | undefined> => {
        if (!ObjectId.isValid(id)) return Promise.resolve(undefined);
        const client = await this.getMongoClient();
        const instance = await client
            .db()
            .collection<InstanceTemplateDbModel>(this.collectionName)
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
            createdBy: DatabaseInstanceTemplateRepository.parseObjectId(match.createdBy),
            textSearch: match.textSearch
                ? { $regex: match.textSearch.toLowerCase(), $options: 'i' }
                : undefined,
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

        const collection = client.db().collection<InstanceTemplateDbModel>(this.collectionName);
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
            .collection<InstanceTemplateDbModel>(this.collectionName)
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
            .collection<InstanceTemplateDbModel>(this.collectionName)
            .deleteOne({ _id: new ObjectId(instanceTemplate.id) }, { ignoreUndefined: true });
    };
}
