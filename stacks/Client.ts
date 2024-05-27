import * as sst from 'sst/constructs';
import { Api } from './Api';
import { Auth } from './Auth';
import { AppSyncApi } from './AppSyncApi';
import { ConnectionGateway } from './ConnectionGateway';
import { featureFlagIsEnabled } from './config/feature-flags';

export const Client = ({ stack, app }: sst.StackContext) => {
    const { userPool, userPoolClient, userPoolDomain, identityPoolId, userPoolIdentityProvider } =
        sst.use(Auth);
    const { appSyncApi } = sst.use(AppSyncApi);
    const { api } = sst.use(Api);
    const { serviceWebsocketUrl } = sst.use(ConnectionGateway);

    const staticSite = new sst.StaticSite(stack, 'StaticSite', {
        path: 'packages/client',
        buildCommand: 'npm run build',
        buildOutput: 'dist',
        environment: {
            VITE_APP_AWS_REGION: app.region,
            VITE_APP_AWS_USER_POOL_ID: userPool.userPoolId,
            VITE_APP_AWS_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
            VITE_APP_AWS_IDENTITY_POOL_ID: identityPoolId ?? '',
            VITE_APP_AWS_USER_POOL_DOMAIN: userPoolDomain.baseUrl().split('//')[1],
            VITE_APP_AWS_USER_POOL_SELF_SIGN_UP: featureFlagIsEnabled({
                featureFlag: 'USER_POOL_SELF_SIGN_UP',
                components: ['Client Sign Up Component'],
            })
                ? 'true'
                : 'false',
            VITE_APP_ENABLE_IDENTITY_PROVIDER: userPoolIdentityProvider ? 'true' : 'false',
            VITE_APP_AWS_IDENTITY_PROVIDER_NAME: userPoolIdentityProvider?.providerName ?? '',
            VITE_APP_API_URL: api.url,
            VITE_APP_APP_SYNC_API_URL: appSyncApi.url,
            VITE_APP_WEBSOCKET_SERVER_URL: serviceWebsocketUrl,
        },
    });

    stack.addOutputs({
        staticSiteUrl: staticSite.url ?? 'http://localhost:5173/',
    });

    return {
        staticSite,
    };
};
