import * as sst from 'sst/constructs';
import { Auth } from './Auth';
import { Config } from './Config';
import { AppSyncApi } from './AppSyncApi';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export const Api = ({ stack, app }: sst.StackContext) => {
    const { userPool, userPoolClient } = sst.use(Auth);
    const { DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD } = sst.use(Config);
    const { appSyncApi } = sst.use(AppSyncApi);

    const apiLambdaRole = new Role(stack, 'ApiLambdaRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
            ManagedPolicy.fromManagedPolicyArn(
                stack,
                'ApiLambdaRoleServiceCatalogManagedPolicy',
                'arn:aws:iam::aws:policy/AWSServiceCatalogEndUserFullAccess',
            ),
        ],
    });

    const migrateDbScript = new sst.Script(stack, 'MigrateDbScript', {
        onCreate: 'packages/api/modules/core/handlers.migrateDatabase',
        onUpdate: 'packages/api/modules/core/handlers.migrateDatabase',
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
            function: {
                environment: {
                    DATABASE_URL,
                    APP_SYNC_API_URL: appSyncApi.url,
                },
            },
        },
        routes: {
            'GET /api/v1/users': {
                function: {
                    handler: 'packages/api/modules/user/handlers.listUsers',
                },
            },
            'GET /api/v1/users/{userId}/groups': {
                function: {
                    handler: 'packages/api/modules/group/handlers/listUserGroups.handler',
                },
            },
            'GET /api/v1/users/{userId}/instances': {
                function: {
                    handler: 'packages/api/modules/instance/handlers/listUserInstances.handler',
                    permissions: ['ec2:*'],
                },
            },
            'DELETE /api/v1/users/{userId}/instances/{instanceId}': {
                function: {
                    handler: 'packages/api/modules/instance/handlers/deleteInstance.handler',
                    permissions: ['ec2:*'],
                },
            },
            'POST /api/v1/users/{userId}/instances/{instanceId}/state': {
                function: {
                    handler: 'packages/api/modules/instance/handlers/changeInstanceState.handler',
                    permissions: ['ec2:*'],
                },
            },
            'GET /api/v1/users/{userId}/instances/{instanceId}/connection': {
                function: {
                    handler: 'packages/api/modules/instance/handlers/getInstanceConnection.handler',
                    permissions: ['ec2:*'],
                    environment: {
                        DATABASE_URL,
                        GUACAMOLE_CYPHER_KEY,
                        INSTANCE_PASSWORD,
                    },
                },
            },
            'PATCH /api/v1/users/{userId}/role': {
                function: {
                    handler: 'packages/api/modules/user/handlers.updateUserRole',
                },
            },
            'GET /api/v1/users/{userId}/quota': {
                function: {
                    handler: 'packages/api/modules/user/handlers.getUserQuota',
                },
            },
            'GET /api/v1/groups': {
                function: {
                    handler: 'packages/api/modules/group/handlers/listGroups.handler',
                },
            },
            'POST /api/v1/groups': {
                function: {
                    handler: 'packages/api/modules/group/handlers/createGroup.handler',
                    permissions: ['servicecatalog:*'],
                },
            },
            'DELETE /api/v1/groups/{groupId}': {
                function: {
                    handler: 'packages/api/modules/group/handlers/deleteGroup.handler',
                },
            },
        },
    });

    const apiEventBus = new sst.EventBus(stack, 'ApiEventBus', {
        cdk: {
            eventBus: EventBus.fromEventBusName(stack, 'DefaultEventBus', 'default'),
        },
        rules: {
            onEc2InstanceStateChange: {
                pattern: {
                    detailType: ['EC2 Instance State-change Notification'],
                    source: ['aws.ec2'],
                },
                targets: {
                    lambda: {
                        type: 'function',
                        function: {
                            handler:
                                'packages/api/modules/instance/handlers/onEc2InstanceStateChange.handler',
                            permissions: ['ec2:*', 'appsync:GraphQL'],
                            environment: {
                                APP_SYNC_API_URL: appSyncApi.url,
                                DATABASE_URL,
                            },
                        },
                    },
                },
            },
        },
    });

    stack.addOutputs({
        apiUrl: api.url,
        apiEventBusName: apiEventBus.eventBusName,
    });

    return {
        api,
        apiEventBus,
        migrateDbScript,
        apiLambdaRole,
    };
};
