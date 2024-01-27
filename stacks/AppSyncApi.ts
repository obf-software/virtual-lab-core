import * as sst from 'sst/constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import { Auth } from './Auth';

export const AppSyncApi = ({ stack }: sst.StackContext) => {
    const { userPool } = sst.use(Auth);

    const appSyncApi = new sst.AppSyncApi(stack, 'AppSyncApi', {
        schema: 'packages/app-sync-api/schema.graphql',
        cdk: {
            graphqlApi: {
                authorizationConfig: {
                    defaultAuthorization: {
                        authorizationType: appsync.AuthorizationType.USER_POOL,
                        userPoolConfig: {
                            userPool,
                        },
                    },
                    additionalAuthorizationModes: [
                        {
                            authorizationType: appsync.AuthorizationType.IAM,
                        },
                    ],
                },
            },
        },
        dataSources: { noneDS: { type: 'none' } },
        resolvers: {
            'Mutation publish': {
                dataSource: 'noneDS',
                requestMapping: { file: 'packages/app-sync-api/resolvers/publish/request.vtl' },
                responseMapping: { file: 'packages/app-sync-api/resolvers/publish/response.vtl' },
            },
            'Subscription subscribe': {
                dataSource: 'noneDS',
                requestMapping: { file: 'packages/app-sync-api/resolvers/subscribe/request.vtl' },
                responseMapping: { file: 'packages/app-sync-api/resolvers/subscribe/response.vtl' },
            },
        },
    });

    stack.addOutputs({
        appSyncApiUrl: appSyncApi.url,
    });

    return {
        appSyncApi,
    };
};
