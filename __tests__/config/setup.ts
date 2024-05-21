import { TestDatabaseInstanceManager } from '../fixtures/testDatabaseInstanceManager';

export = async function globalSetup() {
    await TestDatabaseInstanceManager.setupInstance();
};
