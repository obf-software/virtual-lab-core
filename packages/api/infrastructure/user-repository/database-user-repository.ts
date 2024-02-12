import { Filter, MongoClient, ObjectId, Sort } from 'mongodb';
import { ConfigVault } from '../../application/config-vault';
import { UserRepository } from '../../application/user-repository';
import { Errors } from '../../domain/dtos/errors';
import { User } from '../../domain/entities/user';
import { UserDbModel } from '../db/models/user';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';

export class DatabaseUserRepository implements UserRepository {
    private dbClient?: MongoClient;

    constructor(
        private readonly configVault: ConfigVault,
        private readonly DATABASE_URL_PARAMETER_NAME: string,
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

    disconnect = async (): Promise<void> => {
        if (this.dbClient !== undefined) {
            await this.dbClient.close();
            this.dbClient = undefined;
        }
    };

    static mapUserDbModelToEntity = (model: UserDbModel): User => {
        return User.restore({
            id: model._id.toJSON(),
            username: model.username,
            role: model.role,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            lastLoginAt: model.lastLoginAt,
            groupIds: model.groupIds.map((id) => id.toJSON()),
            quotas: model.quotas,
        });
    };

    static mapUserEntityToDbModel = (entity: User): UserDbModel => {
        const data = entity.toJSON();

        return {
            _id: data.id ? new ObjectId(data.id) : new ObjectId(),
            textSearch: [data.username].join(' '),
            username: data.username,
            role: data.role,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastLoginAt: data.lastLoginAt,
            groupIds: data.groupIds.map((id) => new ObjectId(id)),
            quotas: data.quotas,
        };
    };

    save = async (user: User): Promise<string> => {
        const client = await this.getMongoClient();
        const newUser = await client
            .db()
            .collection<UserDbModel>('users')
            .insertOne(DatabaseUserRepository.mapUserEntityToDbModel(user), {
                ignoreUndefined: true,
            });
        return newUser.insertedId.toJSON();
    };

    getById = async (id: string): Promise<User | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;
        const client = await this.getMongoClient();
        const user = await client
            .db()
            .collection<UserDbModel>('users')
            .findOne({ _id: new ObjectId(id) });
        if (!user) return undefined;
        return DatabaseUserRepository.mapUserDbModelToEntity(user);
    };

    getByUsername = async (username: string): Promise<User | undefined> => {
        const client = await this.getMongoClient();
        const user = await client.db().collection<UserDbModel>('users').findOne({ username });
        if (!user) return undefined;
        return DatabaseUserRepository.mapUserDbModelToEntity(user);
    };

    list = async (
        match: {
            groupId?: string;
            textSearch?: string;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'alphabetical',
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
            textSearch: match.textSearch ? { $regex: match.textSearch, $options: 'i' } : undefined,
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
            alphabetical: {
                textSearch: sortOrder,
                _id: sortOrder,
            },
        };

        const collection = client.db().collection<UserDbModel>('users');
        const [count, users] = await Promise.all([
            collection.countDocuments(filter, { ignoreUndefined: true }),
            collection
                .find(filter, { ignoreUndefined: true })
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
    };
}
