import { IdentitySource } from 'aws-cdk-lib/aws-apigateway';
import * as sst from 'sst/constructs';
import { Auth } from './Auth';

export function Api({ stack }: sst.StackContext) {
    const { userPool, userPoolClient } = sst.use(Auth);

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
    };
}
