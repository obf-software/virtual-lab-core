import * as sst from 'sst/constructs';
import { Auth } from './Auth';
import { Config } from './Config';

export function Api({ stack, app }: sst.StackContext) {
    const { userPool, userPoolClient } = sst.use(Auth);
    const { DATABASE_URL } = sst.use(Config);

    const migrateDbScript = new sst.Script(stack, 'MigrateDbScript', {
        onCreate: 'packages/api/scripts/migrate-db.handler',
        onUpdate: 'packages/api/scripts/migrate-db.handler',
        defaults: {
            function: {
                environment: {
                    DATABASE_URL,
                },
                copyFiles: [
                    {
                        from: 'packages/api/drizzle',
                        to: 'drizzle',
                    },
                ],
            },
        },
        params: {
            appMode: app.mode,
        },
    });

    const api = new sst.Api(stack, 'Api', {
        cors: true,
        authorizers: {
            userPool: {
                type: 'user_pool',
                userPool: {
                    region: userPool.stack.region,
                    id: userPool.userPoolId,
                    clientIds: [userPoolClient.userPoolClientId],
                },
            },
        },
        accessLog: {
            retention: 'one_week',
        },
        defaults: {
            authorizer: 'userPool',
            payloadFormatVersion: '2.0',
        },
        routes: {
            'GET /api/v1/users': {
                function: {
                    handler: 'packages/api/modules/users/handlers.listUsers',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'GET /api/v1/users/{userId}/groups': {
                function: {
                    handler: 'packages/api/modules/users/handlers.listUserGroups',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },

            'GET /api/v1/groups': {
                function: {
                    handler: 'packages/api/modules/groups/handlers.listGroups',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
        },
    });

    stack.addOutputs({
        apiUrl: api.url,
    });

    return {
        api,
        migrateDbScript,
    };
}
