import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

export class TestDatabaseInstanceManager {
    static readonly setupInstance = async () => {
        const instance = await MongoMemoryServer.create();

        Object.defineProperty(global, 'LOCAL_MONGODB_INSTANCE', {
            value: instance,
            writable: true,
        });

        const uri = instance.getUri();
        process.env.TEST_DATABASE_URI = uri;
    };

    static readonly destroyInstance = async () => {
        const { LOCAL_MONGODB_INSTANCE } = global as unknown as {
            LOCAL_MONGODB_INSTANCE: MongoMemoryServer | undefined;
        };

        await LOCAL_MONGODB_INSTANCE?.stop();
    };

    static readonly clearDatabase = async () => {
        const uri = process.env.TEST_DATABASE_URI;
        if (!uri) throw new Error(`process.env.TEST_DATABASE_URI is not set`);
        const client = await MongoClient.connect(uri);
        await client.db().dropDatabase();
        await client.close();
    };
}
