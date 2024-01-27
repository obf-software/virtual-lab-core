import { ConfigVault } from '../../application/config-vault';
import { Filter, MongoClient, ObjectId, Sort } from 'mongodb';
import { GroupRepository } from '../../application/group-repository';
import { Group } from '../../domain/entities/group';
import { GroupDbModel } from '../db/models/group';
import { Errors } from '../../domain/dtos/errors';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { UserDbModel } from '../db/models/user';

export class DatabaseGroupRepository implements GroupRepository {
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
        const { id, createdBy, ...rest } = entity.toJSON();

        return {
            _id: id ? new ObjectId(id) : new ObjectId(),
            createdBy: new ObjectId(createdBy),
            ...rest,
        };
    };

    save = async (group: Group): Promise<string> => {
        const client = await this.getMongoClient();
        const newGroup = await client
            .db()
            .collection<GroupDbModel>('groups')
            .insertOne(DatabaseGroupRepository.mapGroupEntityToDbModel(group));
        await client.close();
        return newGroup.insertedId.toJSON();
    };

    getById = async (id: string): Promise<Group | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;

        const client = await this.getMongoClient();
        const group = await client
            .db()
            .collection<GroupDbModel>('groups')
            .findOne({ _id: new ObjectId(id) }, { ignoreUndefined: true });
        await client.close();
        if (!group) return undefined;
        return DatabaseGroupRepository.mapGroupDbModelToEntity(group);
    };

    list = async (
        match: {
            createdBy?: string;
            textQuery?: string;
            userId?: string;
        },
        orderBy: 'creationDate' | 'lastUpdate' | 'name',
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
            name: match.textQuery ? { $regex: match.textQuery, $options: 'i' } : undefined,
            _id: userGroupsIds.length > 0 ? { $in: userGroupsIds } : undefined,
        };

        const sortOrder = order === 'asc' ? 1 : -1;
        const sortMap: Record<typeof orderBy, Sort> = {
            creationDate: {
                _id: sortOrder,
            },
            lastUpdate: {
                updatedAt: sortOrder,
                _id: sortOrder,
            },
            name: {
                name: sortOrder,
                _id: sortOrder,
            },
        };

        const collection = client.db().collection<GroupDbModel>('groups');
        const [count, sites] = await Promise.all([
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
            .collection<GroupDbModel>('groups')
            .updateOne(
                { _id: new ObjectId(group.id) },
                { $set: DatabaseGroupRepository.mapGroupEntityToDbModel(group) },
                { ignoreUndefined: true, upsert: false },
            );
        await client.close();
    };

    delete = async (group: Group): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<GroupDbModel>('groups')
            .deleteOne({ _id: new ObjectId(group.id) });
        await client.close();
    };
}
