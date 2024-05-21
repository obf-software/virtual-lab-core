import { MongoClient, ObjectId } from 'mongodb';

export class TestDatabaseManager {
    static readonly generateRandomCollectionName = () =>
        `collection-${new ObjectId().toHexString()}`;

    static readonly getUriWithRandomDatabase = () => {
        const uriEnvar = process.env.TEST_DATABASE_URI;
        if (!uriEnvar) throw new Error('process.env.TEST_DATABASE_URI is not set');

        const { protocol, host } = new URL(uriEnvar);
        const databaseName = `db-${new ObjectId().toHexString()}`;
        return `${protocol}//${host}/${databaseName}`;
    };

    static readonly clearCollection = async (input: {
        databaseUri: string;
        collectionName: string;
    }) => {
        const client = await MongoClient.connect(input.databaseUri);
        await client.db().collection(input.collectionName).deleteMany({});
        await client.close();
    };

    static readonly populateCollection = async (input: {
        databaseUri: string;
        collectionName: string;
        data: Record<string, unknown>[];
    }) => {
        if (input.data.length === 0) return;
        const client = await MongoClient.connect(input.databaseUri);
        await client.db().collection(input.collectionName).insertMany(input.data);
        await client.close();
    };
}
