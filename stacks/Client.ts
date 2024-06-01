import * as sst from 'sst/constructs';
import { Api } from './Api';
import { Auth } from './Auth';
import { AppSyncApi } from './AppSyncApi';
import { ConnectionGateway } from './ConnectionGateway';
import { featureFlagIsEnabled } from './config/feature-flags';
import { Docs } from './Docs';

export const Client = ({ stack, app }: sst.StackContext) => {
    const { userPool, userPoolClient, userPoolDomain, identityPoolId, userPoolIdentityProvider } =
        sst.use(Auth);
    const { appSyncApi } = sst.use(AppSyncApi);
    const { api } = sst.use(Api);
    const { docsSite } = sst.use(Docs);
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

    const siteUrl = staticSite.customDomainUrl ?? staticSite.url ?? 'http://localhost:5173/';

    const docsSiteUrl = docsSite.customDomainUrl ?? docsSite.url ?? 'http://localhost:3000/';

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const updateUserPoolNotificationsScript = new sst.Script(
        stack,
        'UpdateUserPoolNotificationsScript',
        {
            defaults: {
                function: {
                    permissions: ['cognito-idp:*', 'iam:PassRole'],
                    environment: {
                        COGNITO_USER_POOL_ID: userPool.userPoolId,
                    },
                },
            },
            onCreate: 'packages/api/interfaces/jobs/updateUserPoolGateway.handler',
            onUpdate: 'packages/api/interfaces/jobs/updateUserPoolGateway.handler',
            params: {
                inviteUserEmailSubject: `Convite Virtual Lab`,
                inviteUserEmailMessage: `
                <p>Você foi convidado para acessar o Virtual Lab.</p>
                <br/>
                <p><a href="${siteUrl}">${siteUrl}</a>
                <br/>
                <p>Usuário: {username}</p>
                <p>Senha temporária: <b>{####}</b></p>
                <br/>
                <p><b>Atenção:</b> A senha temporária de acesso é valida apenas para a primeira sessão e expira em 30 dias.</p>
                <br/>
                <p>Para mais informações, acesse a documentação em <a href="${docsSiteUrl}">${docsSiteUrl}</a></p>
                <br/>
                <p>Atenciosamente,</p>
                <p>Equipe Virtual Lab</p>
                `,
                inviteUserSmsMessage: `Acesse sua conta Virtual Lab com o usuário {username} e a senha temporária {####} em ${siteUrl}`,
                verificationEmailSubject: `Código de verificação Virtual Lab`,
                verificationEmailMessage: `
                <p>Copie e cole esse código no aplicativo para validar seu endereço de email:</p>
                <br/>
                <p><b>{####}</b></p>
                <br/>
                <a href="${siteUrl}">${siteUrl}</a>
                <br/>
                <p>Se você não pediu um código de verificação, por favor ignore esse email.</p>
                <br/>
                <p>Para mais informações, acesse a documentação em <a href="${docsSiteUrl}">${docsSiteUrl}</a></p>
                <br/>
                <p>Atenciosamente,</p>
                <p>Equipe Virtual Lab</p>
                `,
                verificationSmsMessage: `Código de verificação Virtual Lab: {####}`,
            },
        },
    );

    stack.addOutputs({
        staticSiteUrl: siteUrl,
    });

    return {
        staticSite,
    };
};
