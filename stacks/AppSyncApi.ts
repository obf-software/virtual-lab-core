import * as sst from 'sst/constructs';
import { Auth } from './Auth';
import { AuthorizationType } from 'aws-cdk-lib/aws-appsync';

export const AppSyncApi = ({ stack }: sst.StackContext) => {
    const { userPool } = sst.use(Auth);

    const appSyncApi = new sst.AppSyncApi(stack, 'AppSyncApi', {
        schema: 'packages/app-sync/schema.graphql',
        cdk: {
            graphqlApi: {
                authorizationConfig: {
                    defaultAuthorization: {
                        authorizationType: AuthorizationType.USER_POOL,
                        userPoolConfig: { userPool },
                    },
                    additionalAuthorizationModes: [{ authorizationType: AuthorizationType.IAM }],
                },
            },
        },
        dataSources: { noneDS: { type: 'none' } },
        resolvers: {
            'Mutation publish': {
                dataSource: 'noneDS',
                requestMapping: { file: 'packages/app-sync/resolvers/publish/request.vtl' },
                responseMapping: { file: 'packages/app-sync/resolvers/publish/response.vtl' },
            },
            'Subscription subscribe': {
                dataSource: 'noneDS',
                requestMapping: { file: 'packages/app-sync/resolvers/subscribe/request.vtl' },
                responseMapping: { file: 'packages/app-sync/resolvers/subscribe/response.vtl' },
            },
        },
    });

    return {
        appSyncApi,
    };
};
