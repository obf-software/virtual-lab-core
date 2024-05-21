import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    verbose: true,
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    testPathIgnorePatterns: [
        'node_modules',
        '_dev',
        '.sst',
        '.docusaurus',
        'build',
        'dist',
        'coverage',
    ],
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                isolatedModules: true,
            },
        ],
    },
    globalSetup: '<rootDir>/__tests__/config/setup.ts',
    globalTeardown: '<rootDir>/__tests__/config/teardown.ts',
    setupFilesAfterEnv: ['<rootDir>/__tests__/config/lifecycle.ts'],
    maxWorkers: 4,
    passWithNoTests: true,
};

export default config;
