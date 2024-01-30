import * as sst from 'sst/constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Auth } from './Auth';
import { Config } from './Config';
import { AppSyncApi } from './AppSyncApi';
import { LambdaLayers } from './LambdaLayers';

export const Api = ({ stack }: sst.StackContext) => {
    const { paramsAndSecretsExtension } = sst.use(LambdaLayers);
    const { userPool, userPoolClient } = sst.use(Auth);
    const { ssmParameters } = sst.use(Config);
    const { appSyncApi } = sst.use(AppSyncApi);

    const apiSnsTopic = new sns.Topic(stack, 'ServiceCatalogTopic', {
        displayName: 'API Service Catalog Topic',
    });

    const apiEventBus = new sst.EventBus(stack, 'ApiEventBus', {
        cdk: {
            eventBus: events.EventBus.fromEventBusName(stack, 'DefaultEventBus', 'default'),
        },
    });

    const apiLambdaDefaultRole = new iam.Role(stack, 'ApiLambdaDefaultRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                'service-role/AWSLambdaVPCAccessExecutionRole',
            ),
            iam.ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess'),
            iam.ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogAdminFullAccess'),
        ],
    });

    const api = new sst.Api(stack, 'Api', {
        cors: true,
        authorizers: {
            userPool: {
                type: 'user_pool',
                userPool: {
                    id: userPool.userPoolId,
                    clientIds: [userPoolClient.userPoolClientId],
                    region: userPool.stack.region,
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
                permissions: [
                    appSyncApi,
                    'ssm:*',
                    'secretsmanager:*',
                    'cloudformation:*',
                    'servicecatalog:*',
                    'ec2:*',
                    's3:*',
                    'iam:*',
                    'sns:*',
                ],
                environment: {
                    SHARED_SECRET_NAME: 'not-used-yet',
                    APP_SYNC_API_URL: appSyncApi.url,
                    API_EVENT_BUS_NAME: apiEventBus.eventBusName,
                    API_SNS_TOPIC_ARN: apiSnsTopic.topicArn,

                    DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
                    INSTANCE_PASSWORD_PARAMETER_NAME: ssmParameters.instancePassword.name,
                    GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: ssmParameters.guacamoleCypherKey.name,
                    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME:
                        ssmParameters.serviceCatalogPortfolioId.name,
                },
                layers: [paramsAndSecretsExtension],
                role: apiLambdaDefaultRole,
            },
        },
    });

    /**
     * Group module
     */
    api.addRoutes(stack, {
        'POST /api/v1/groups': {
            function: 'packages/api/interfaces/api/group/create-group.handler',
        },
        'DELETE /api/v1/groups/{groupId}': {
            function: 'packages/api/interfaces/api/group/delete-group.handler',
        },
        'POST /api/v1/groups/{groupId}/link-users': {
            function: 'packages/api/interfaces/api/group/link-users-to-group.handler',
        },
        'GET /api/v1/groups': {
            function: 'packages/api/interfaces/api/group/list-groups.handler',
        },
        'POST /api/v1/groups/{groupId}/unlink-users': {
            function: 'packages/api/interfaces/api/group/unlink-users-from-group.handler',
        },
        'PATCH /api/v1/groups/{groupId}': {
            function: 'packages/api/interfaces/api/group/update-group.handler',
        },
    });

    /**
     * Instance module
     */
    api.addRoutes(stack, {
        'DELETE /api/v1/instances/{instanceId}': {
            function: 'packages/api/interfaces/api/instance/delete-instance.handler',
        },
        'GET /api/v1/instances/{instanceId}/connection': {
            function: 'packages/api/interfaces/api/instance/get-instance-connection.handler',
        },
        'POST /api/v1/instances': {
            function: 'packages/api/interfaces/api/instance/launch-instance.handler',
        },
        'GET /api/v1/instance-templates': {
            function: 'packages/api/interfaces/api/instance/list-instance-templates.handler',
        },
        'GET /api/v1/instances': {
            function: 'packages/api/interfaces/api/instance/list-instances.handler',
        },
        'POST /api/v1/instances/{instanceId}/reboot': {
            function: 'packages/api/interfaces/api/instance/reboot-instance.handler',
        },
        'POST /api/v1/instances/{instanceId}/turn-off': {
            function: 'packages/api/interfaces/api/instance/turn-instance-off.handler',
        },
        'POST /api/v1/instances/{instanceId}/turn-on': {
            function: 'packages/api/interfaces/api/instance/turn-instance-on.handler',
        },
    });

    /**
     * User module
     */
    api.addRoutes(stack, {
        'GET /api/v1/users/{userId}': {
            function: 'packages/api/interfaces/api/user/get-user.handler',
        },
        'GET /api/v1/users': {
            function: 'packages/api/interfaces/api/user/list-users.handler',
        },
        'PATCH /api/v1/users/{userId}/quotas': {
            function: 'packages/api/interfaces/api/user/update-user-quotas.handler',
        },
        'PATCH /api/v1/users/{userId}/role': {
            function: 'packages/api/interfaces/api/user/update-user-role.handler',
        },
    });

    apiEventBus.addRules(stack, {
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
                            'packages/api/interfaces/events/on-ec2-instance-state-change-notification.handler',
                        permissions: [appSyncApi, 'ssm:*', 'secretsmanager:*', 'events:*'],
                        environment: {
                            SHARED_SECRET_NAME: 'not-used-yet',
                            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
                            API_EVENT_BUS_NAME: apiEventBus.eventBusName,
                            APP_SYNC_API_URL: appSyncApi.url,
                        },
                    },
                },
            },
        },
    });

    stack.addOutputs({
        apiUrl: api.url,
    });

    return {
        api,
        apiLambdaDefaultRole,
        apiEventBus,
        apiSnsTopic,
    };
};
