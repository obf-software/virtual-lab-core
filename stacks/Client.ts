import * as sst from 'sst/constructs';
import { Api } from './Api';
import { Auth } from './Auth';

export function Client({ stack, app }: sst.StackContext) {
    const { api } = sst.use(Api);
    const { userPool, userPoolClient } = sst.use(Auth);

    const client = new sst.NextjsSite(stack, 'Client', {
        path: 'packages/client',
        runtime: 'nodejs18.x',
        environment: {
            NEXT_PUBLIC_AWS_REGION: app.region,
            NEXT_PUBLIC_AWS_USER_POOL_ID: userPool.userPoolId,
            NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            NEXT_PUBLIC_API_URL: api.url,
        },
    });

    stack.addOutputs({
        clientUrl: client.url,
    });

    return {
        client,
    };
}
