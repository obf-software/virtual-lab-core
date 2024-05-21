import { TestDatabaseInstanceManager } from '../fixtures/testDatabaseInstanceManager';

jest.mock('node-fetch', () => jest.fn());

beforeAll(async () => {
    await TestDatabaseInstanceManager.clearDatabase();
});
