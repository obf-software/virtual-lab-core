import { MongoClient, ObjectId } from 'mongodb';
import { ConfigVault } from '../../application/config-vault';
import { Errors } from '../../domain/dtos/errors';

type ParseObjectIdResponse<T> = T extends string
    ? ObjectId
    : T extends null
      ? null
      : T extends undefined
        ? undefined
        : never;

export abstract class MongoRepositoryAdapter {
    private static mongoDbClient?: MongoClient;

    constructor(
        private readonly deps: {
            readonly configVault: ConfigVault;
            readonly DATABASE_URL_PARAMETER_NAME: string;
        },
    ) {}

    static readonly createTextSearchField = (
        items: (string | number | undefined | null)[],
    ): string =>
        items
            .filter((i): i is string | number => i !== undefined && i !== null)
            .map((i) => i.toString().toLowerCase())
            .filter((i, index, self) => self.indexOf(i) === index)
            .join(' ')
            .trim();

    /**
     * Function that helps to parse an id to an ObjectId with type safety.
     *
     * @param id The id to parse.
     * @returns The parsed id as an ObjectId, null or undefined depending on the input.
     */
    static readonly parseObjectId = <T extends string | null | undefined>(
        id: T,
    ): ParseObjectIdResponse<T> => {
        if (id === null) return null as ParseObjectIdResponse<T>;
        if (id === undefined) return undefined as ParseObjectIdResponse<T>;
        return new ObjectId(id) as ParseObjectIdResponse<T>;
    };

    protected getMongoClient = async (): Promise<MongoClient> => {
        if (MongoRepositoryAdapter.mongoDbClient !== undefined) {
            return MongoRepositoryAdapter.mongoDbClient;
        }

        const retrievedDatabaseUrl = await this.deps.configVault.getParameter(
            this.deps.DATABASE_URL_PARAMETER_NAME,
        );
        if (retrievedDatabaseUrl === undefined) {
            throw Errors.internalError(
                `Failed to retrieve database url from parameter: ${this.deps.DATABASE_URL_PARAMETER_NAME}`,
            );
        }

        const newClient = new MongoClient(retrievedDatabaseUrl);
        MongoRepositoryAdapter.mongoDbClient = newClient;
        return newClient;
    };

    // eslint-disable-next-line class-methods-use-this
    disconnect = async (): Promise<void> => {
        if (MongoRepositoryAdapter.mongoDbClient !== undefined) {
            await MongoRepositoryAdapter.mongoDbClient.close();
            MongoRepositoryAdapter.mongoDbClient = undefined;
        }
    };
}
