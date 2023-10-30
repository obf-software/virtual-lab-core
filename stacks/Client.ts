import * as sst from 'sst/constructs';
import { Api } from './Api';
import { Auth } from './Auth';
import { AppSyncApi } from './AppSyncApi';

export const Client = ({ stack, app }: sst.StackContext) => {
    const { api } = sst.use(Api);
    const { userPool, userPoolClient } = sst.use(Auth);
    const { appSyncApi } = sst.use(AppSyncApi);

    const staticSite = new sst.StaticSite(stack, 'StaticSite', {
        path: 'packages/client',
        buildCommand: 'npm run build',
        buildOutput: 'dist',
        environment: {
            VITE_APP_AWS_REGION: app.region,
            VITE_APP_AWS_USER_POOL_ID: userPool.userPoolId,
            VITE_APP_AWS_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            VITE_APP_API_URL: api.url,
            VITE_APP_APP_SYNC_API_URL: appSyncApi.url,
            VITE_APP_WEBSOCKET_SERVER_URL: 'ws://localhost:8080/',
        },
    });

    stack.addOutputs({
        staticSiteUrl: staticSite.url ?? 'N/A',
    });

    return {
        staticSite,
    };
};
