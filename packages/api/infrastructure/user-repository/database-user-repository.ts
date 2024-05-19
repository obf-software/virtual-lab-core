import { Filter, ObjectId, Sort } from 'mongodb';
import { ConfigVault } from '../../application/config-vault';
import { UserRepository } from '../../application/user-repository';
import { User } from '../../domain/entities/user';
import { UserDbModel } from '../db/models/user';
import { SeekPaginated, SeekPaginationInput } from '../../domain/dtos/seek-paginated';
import { MongoRepositoryAdapter } from '../adapter/mongoRepositoryAdapter';

export class DatabaseUserRepository extends MongoRepositoryAdapter implements UserRepository {
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
        this.collectionName = deps.collectionName ?? 'users';
    }

    static mapUserDbModelToEntity = (model: UserDbModel): User => {
        return User.restore({
            id: model._id.toHexString(),
            username: model.username,
            name: model.name,
            preferredUsername: model.preferredUsername,
            role: model.role,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            lastLoginAt: model.lastLoginAt,
            quotas: model.quotas,
        });
    };

    static mapUserEntityToDbModel = (entity: User): UserDbModel => {
        const data = entity.getData();

        return {
            _id: DatabaseUserRepository.parseObjectId(data.id) ?? new ObjectId(),
            username: data.username,
            name: data.name,
            preferredUsername: data.preferredUsername,
            role: data.role,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lastLoginAt: data.lastLoginAt,
            quotas: data.quotas,

            textSearch: DatabaseUserRepository.createTextSearchField([
                data.name,
                data.preferredUsername,
                data.username,
                data.role,
            ]),
        };
    };

    save = async (user: User): Promise<string> => {
        const client = await this.getMongoClient();
        const newUser = await client
            .db()
            .collection<UserDbModel>(this.collectionName)
            .insertOne(DatabaseUserRepository.mapUserEntityToDbModel(user), {
                ignoreUndefined: true,
            });
        return newUser.insertedId.toHexString();
    };

    getById = async (id: string): Promise<User | undefined> => {
        if (!ObjectId.isValid(id)) return undefined;
        const client = await this.getMongoClient();
        const user = await client
            .db()
            .collection<UserDbModel>(this.collectionName)
            .findOne({ _id: new ObjectId(id) });
        if (!user) return undefined;
        return DatabaseUserRepository.mapUserDbModelToEntity(user);
    };

    getByUsername = async (username: string): Promise<User | undefined> => {
        const client = await this.getMongoClient();
        const user = await client
            .db()
            .collection<UserDbModel>(this.collectionName)
            .findOne({ username });
        if (!user) return undefined;
        return DatabaseUserRepository.mapUserDbModelToEntity(user);
    };

    list = async (
        match: {
            textSearch?: string;
        },
        orderBy: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'alphabetical',
        order: 'asc' | 'desc',
        pagination: SeekPaginationInput,
    ): Promise<SeekPaginated<User>> => {
        const client = await this.getMongoClient();

        const filter: Filter<UserDbModel> = {
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
            lastLoginDate: {
                lastLoginAt: sortOrder,
                _id: sortOrder,
            },
            alphabetical: {
                textSearch: sortOrder,
                _id: sortOrder,
            },
        };

        const collection = client.db().collection<UserDbModel>(this.collectionName);
        const [count, users] = await Promise.all([
            collection.countDocuments(filter, { ignoreUndefined: true }),
            collection
                .find(filter, { ignoreUndefined: true })
                .sort(sortMap[orderBy])
                .skip(pagination.resultsPerPage * (pagination.page - 1))
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
            .collection<UserDbModel>(this.collectionName)
            .find({ _id: { $in: validIds } })
            .toArray();
        return users.map(DatabaseUserRepository.mapUserDbModelToEntity);
    };

    update = async (user: User): Promise<void> => {
        const client = await this.getMongoClient();
        await client
            .db()
            .collection<UserDbModel>(this.collectionName)
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
            .collection<UserDbModel>(this.collectionName)
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
