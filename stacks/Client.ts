import * as sst from 'sst/constructs';
import { Api } from './Api';
import { Auth } from './Auth';

export function Client({ stack, app }: sst.StackContext) {
    const { api } = sst.use(Api);
    const { userPool, userPoolClient } = sst.use(Auth);

    const staticSite = new sst.StaticSite(stack, 'StaticSite', {
        path: 'packages/client',
        buildCommand: 'npm run build',
        buildOutput: 'dist',
        environment: {
            VITE_APP_AWS_REGION: app.region,
            VITE_APP_AWS_USER_POOL_ID: userPool.userPoolId,
            VITE_APP_AWS_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            VITE_APP_API_URL: api.url,
        },
    });

    stack.addOutputs({
        staticSiteUrl: staticSite.url ?? 'N/A',
    });

    return {
        staticSite,
    };
}
