import { ConfigVault } from '../../application/config-vault';
import { Filter, MongoClient, ObjectId, Sort } from 'mongodb';
import { GroupRepository } from '../../application/group-repository';
import { Group } from '../../domain/entities/group';
import { GroupDbModel } from '../db/models/group';
import { Errors } from '../../domain/dtos/errors';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { UserDbModel } from '../db/models/user';

export class DatabaseGroupRepository implements GroupRepository {
    private dbClient?: MongoClient;

    constructor(
        private readonly configVault: ConfigVault,
        private readonly DATABASE_URL_PARAMETER_NAME: string,
        private readonly DATABASE_COLLECTION_NAME = 'groups',
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

    static mapGroupDbModelToEntity = (model: GroupDbModel): Group => {
        return Group.restore({
            id: model._id.toJSON(),
            createdBy: model.createdBy.toJSON(),
            name: model.name,
            description: model.description,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    };

    static mapGroupEntityToDbModel = (entity: Group): GroupDbModel => {
        const data = entity.toJSON();

        return {
            _id: data.id ? new ObjectId(data.id) : new ObjectId(),
            name: data.name,
            description: data.description,
            createdBy: new ObjectId(data.createdBy),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,

            textSearch: [data.name, data.description]
                .filter((x): x is string => typeof x === 'string')
                .map((x) => x.toLowerCase())
                .join(' '),
        };
    };

    save = async (group: Group): Promise<string> => {
        const client = await this.getMongoClient();
        const newGroup = await client
            .db()
            .collection<GroupDbModel>(this.DATABASE_COLLECTION_NAME)
            .insertOne(DatabaseGroupRepository.mapGroupEntityToDbModel(group), {
                ignoreUndefined: true,
            });
        return newGroup.insertedId.toJSON();
    };

    getById = async (id: string): Promise<Group | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;

        const client = await this.getMongoClient();
        const group = await client
            .db()
            .collection<GroupDbModel>(this.DATABASE_COLLECTION_NAME)
            .findOne({ _id: new ObjectId(id) }, { ignoreUndefined: true });
        if (!group) return undefined;
        return DatabaseGroupRepository.mapGroupDbModelToEntity(group);
    };

    list = async (
        match: {
            createdBy?: string;
            textSearch?: string;
            userId?: string;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<Group>> => {
        if (
            !!(match.createdBy && !ObjectId.isValid(match.createdBy)) ||
            !!(match.userId && !ObjectId.isValid(match.userId))
        ) {
            return {
                data: [],
                numberOfPages: 0,
                numberOfResults: 0,
                resultsPerPage: pagination.resultsPerPage,
            };
        }

        const client = await this.getMongoClient();

        let userGroupsIds: ObjectId[] = [];
        if (match.userId) {
            const user = await client
                .db()
                .collection<UserDbModel>('users')
                .findOne({ _id: new ObjectId(match.userId) }, { ignoreUndefined: true });

            userGroupsIds = user?.groupIds ?? [];
        }

        const filter: Filter<GroupDbModel> = {
            createdBy: match.createdBy ? new ObjectId(match.createdBy) : undefined,
            textSearch: match.textSearch ? { $regex: match.textSearch, $options: 'i' } : undefined,
            _id: userGroupsIds.length > 0 ? { $in: userGroupsIds } : undefined,
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

        const collection = client.db().collection<GroupDbModel>(this.DATABASE_COLLECTION_NAME);
        const [count, sites] = await Promise.all([
            collection.countDocuments(filter, { ignoreUndefined: true }),
            collection
                .find(filter, { ignoreUndefined: true })
                .sort(sortMap[orderBy])
                .skip(pagination.resultsPerPage * (pagination.page - 1))
                .limit(pagination.resultsPerPage)
                .toArray(),
        ]);

        return {
            data: sites.map(DatabaseGroupRepository.mapGroupDbModelToEntity),
            numberOfPages: Math.ceil(count / pagination.resultsPerPage),
            numberOfResults: count,
            resultsPerPage: pagination.resultsPerPage,
        };
    };

    update = async (group: Group): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<GroupDbModel>(this.DATABASE_COLLECTION_NAME)
            .updateOne(
                { _id: new ObjectId(group.id) },
                { $set: DatabaseGroupRepository.mapGroupEntityToDbModel(group) },
                { ignoreUndefined: true, upsert: false },
            );
    };

    delete = async (group: Group): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<GroupDbModel>(this.DATABASE_COLLECTION_NAME)
            .deleteOne({ _id: new ObjectId(group.id) });
    };
}
