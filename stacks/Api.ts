import { IdentitySource } from 'aws-cdk-lib/aws-apigateway';
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
                identitySource: [IdentitySource.header('Authorization')],
                userPool: {
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
    });

    stack.addOutputs({
        apiUrl: api.url,
    });

    return {
        api,
        migrateDbScript,
    };
}
