import { Filter, MongoClient, ObjectId, Sort } from 'mongodb';
import { ConfigVault } from '../../application/config-vault';
import { UserRepository } from '../../application/user-repository';
import { Errors } from '../../domain/dtos/errors';
import { User } from '../../domain/entities/user';
import { UserDbModel } from '../db/models/user';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';

export class DatabaseUserRepository implements UserRepository {
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

    static mapUserDbModelToEntity = (model: UserDbModel): User => {
        return User.restore({
            ...model,
            id: model._id.toJSON(),
            groupIds: model.groupIds.map((id) => id.toJSON()),
        });
    };

    static mapUserEntityToDbModel = (entity: User): UserDbModel => {
        const { id, groupIds, ...rest } = entity.toJSON();

        return {
            ...rest,
            _id: id ? new ObjectId(id) : new ObjectId(),
            groupIds: groupIds.map((id) => new ObjectId(id)),
        };
    };

    save = async (user: User): Promise<string> => {
        const client = await this.getMongoClient();
        const newUser = await client
            .db()
            .collection<UserDbModel>('users')
            .insertOne(DatabaseUserRepository.mapUserEntityToDbModel(user));
        await client.close();
        return newUser.insertedId.toJSON();
    };

    getById = async (id: string): Promise<User | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;
        const client = await this.getMongoClient();
        const user = await client
            .db()
            .collection<UserDbModel>('users')
            .findOne({ _id: new ObjectId(id) });
        await client.close();
        if (!user) return undefined;
        return DatabaseUserRepository.mapUserDbModelToEntity(user);
    };

    getByUsername = async (username: string): Promise<User | undefined> => {
        const client = await this.getMongoClient();
        const user = await client.db().collection<UserDbModel>('users').findOne({ username });
        await client.close();
        if (!user) return undefined;
        return DatabaseUserRepository.mapUserDbModelToEntity(user);
    };

    list = async (
        match: {
            textQuery?: string;
            groupId?: string;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'name',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<User>> => {
        if (match.groupId && !ObjectId.isValid(match.groupId)) {
            return {
                data: [],
                numberOfPages: 0,
                numberOfResults: 0,
                resultsPerPage: pagination.resultsPerPage,
            };
        }

        const client = await this.getMongoClient();

        const filter: Filter<UserDbModel> = {
            username: match.textQuery ? { $regex: match.textQuery, $options: 'i' } : undefined,
            groupIds: match.groupId ? new ObjectId(match.groupId) : undefined,
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
            lastLoginDate: {
                lastLoginAt: sortOrder,
                _id: sortOrder,
            },
            name: {
                name: sortOrder,
                _id: sortOrder,
            },
        };

        const collection = client.db().collection<UserDbModel>('users');
        const [count, users] = await Promise.all([
            collection.countDocuments(filter, { ignoreUndefined: true }),
            collection
                .find(filter, { ignoreUndefined: true })
                .collation({ locale: 'en', strength: 2 })
                .sort(sortMap[orderBy])
                .skip(pagination.page * (pagination.resultsPerPage - 1))
                .limit(pagination.resultsPerPage)
                .toArray(),
        ]);

        return {
            data: users.map(DatabaseUserRepository.mapUserDbModelToEntity),
            numberOfPages: Math.ceil(count / pagination.resultsPerPage),
            numberOfResults: count,
            resultsPerPage: pagination.resultsPerPage,
        };
    };

    listByIds = async (ids: string[]): Promise<User[]> => {
        const validIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
        const client = await this.getMongoClient();
        const users = await client
            .db()
            .collection<UserDbModel>('users')
            .find({ _id: { $in: validIds } })
            .toArray();
        await client.close();
        return users.map(DatabaseUserRepository.mapUserDbModelToEntity);
    };

    update = async (user: User): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<UserDbModel>('users')
            .updateOne(
                { _id: new ObjectId(user.id) },
                { $set: DatabaseUserRepository.mapUserEntityToDbModel(user) },
                { ignoreUndefined: true, upsert: false },
            );
        await client.close();
    };

    bulkUpdate = async (users: User[]): Promise<void> => {
        if (users.length === 0) return;
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<UserDbModel>('users')
            .bulkWrite(
                users.map((user) => ({
                    updateOne: {
                        filter: { _id: new ObjectId(user.id) },
                        update: { $set: DatabaseUserRepository.mapUserEntityToDbModel(user) },
                        upsert: false,
                    },
                })),
                { ignoreUndefined: true },
            );
        await client.close();
    };
}
