import { TestDatabaseInstanceManager } from '../fixtures/testDatabaseInstanceManager';

export = async function globalTeardown() {
    await TestDatabaseInstanceManager.destroyInstance();
};
