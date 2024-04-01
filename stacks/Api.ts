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

    const apiEventBusPublisherRole = new iam.Role(stack, 'ApiEventBusPublisherRole', {
        assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
        inlinePolicies: {
            PutEvents: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        actions: ['events:PutEvents'],
                        resources: [apiEventBus.eventBusArn],
                    }),
                ],
            }),
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
                    'scheduler:*',
                ],
                environment: {
                    SHARED_SECRET_NAME: 'not-used-yet',
                    APP_SYNC_API_URL: appSyncApi.url,
                    API_EVENT_BUS_NAME: apiEventBus.eventBusName,
                    API_SNS_TOPIC_ARN: apiSnsTopic.topicArn,

                    DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
                    INSTANCE_PASSWORD_PARAMETER_NAME: ssmParameters.instancePassword.name,
                    GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: ssmParameters.guacamoleCypherKey.name,
                    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
                        ssmParameters.serviceCatalogLinuxProductId.name,
                    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
                        ssmParameters.serviceCatalogWindowsProductId.name,
                    EVENT_BUS_ARN: apiEventBus.eventBusArn,
                    EVENT_BUS_PUBLISHER_ROLE_ARN: apiEventBusPublisherRole.roleArn,
                },
                layers: [paramsAndSecretsExtension],
                role: apiLambdaDefaultRole,
                timeout: `15 seconds`,
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
     * Instance template module
     */
    api.addRoutes(stack, {
        'POST /api/v1/instances/{instanceId}/create-instance-template': {
            function:
                'packages/api/interfaces/api/instance-templates/create-instance-template-from-instance.handler',
        },
        'POST /api/v1/instance-templates': {
            function:
                'packages/api/interfaces/api/instance-templates/create-instance-template.handler',
        },
        'DELETE /api/v1/instance-templates/{instanceTemplateId}': {
            function:
                'packages/api/interfaces/api/instance-templates/delete-instance-template.handler',
        },
        'GET /api/v1/instance-templates/{instanceTemplateId}': {
            function:
                'packages/api/interfaces/api/instance-templates/get-instance-template.handler',
        },
        'GET /api/v1/instance-templates': {
            function:
                'packages/api/interfaces/api/instance-templates/list-instance-templates.handler',
        },
        'PATCH /api/v1/instance-templates/{instanceTemplateId}': {
            function:
                'packages/api/interfaces/api/instance-templates/update-instance-templates.handler',
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

    /**
     * Misc module
     */
    api.addRoutes(stack, {
        'GET /api/v1/instance-types': {
            function: 'packages/api/interfaces/api/misc/list-instance-types.handler',
        },
        'GET /api/v1/recommended-machine-images': {
            function: 'packages/api/interfaces/api/misc/list-recommended-machine-images.handler',
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
        onInstanceIdle: {
            pattern: {
                detailType: ['INSTANCE_IDLE'],
            },
            targets: {
                lambda: {
                    type: 'function',
                    function: {
                        handler: 'packages/api/interfaces/events/on-instance-idle.handler',
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
                            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
                            API_SNS_TOPIC_ARN: apiSnsTopic.topicArn,
                            SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
                                ssmParameters.serviceCatalogLinuxProductId.name,
                            SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
                                ssmParameters.serviceCatalogWindowsProductId.name,
                            EVENT_BUS_ARN: apiEventBus.eventBusArn,
                            EVENT_BUS_PUBLISHER_ROLE_ARN: apiEventBusPublisherRole.roleArn,
                        },
                    },
                },
            },
        },
        onInstanceConnectionStarted: {
            pattern: {
                detailType: ['INSTANCE_CONNECTION_STARTED'],
            },
            targets: {
                lambda: {
                    type: 'function',
                    function: {
                        handler:
                            'packages/api/interfaces/events/on-instance-connection-started.handler',
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
                            'scheduler:*',
                        ],
                        environment: {
                            SHARED_SECRET_NAME: 'not-used-yet',
                            API_SNS_TOPIC_ARN: apiSnsTopic.topicArn,
                            SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
                                ssmParameters.serviceCatalogLinuxProductId.name,
                            SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
                                ssmParameters.serviceCatalogWindowsProductId.name,
                            EVENT_BUS_ARN: apiEventBus.eventBusArn,
                            EVENT_BUS_PUBLISHER_ROLE_ARN: apiEventBusPublisherRole.roleArn,
                        },
                    },
                },
            },
        },
        onInstanceConnectionEnded: {
            pattern: {
                detailType: ['INSTANCE_CONNECTION_ENDED'],
            },
            targets: {
                lambda: {
                    type: 'function',
                    function: {
                        handler:
                            'packages/api/interfaces/events/on-instance-connection-ended.handler',
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
                            'scheduler:*',
                        ],
                        environment: {
                            SHARED_SECRET_NAME: 'not-used-yet',
                            API_SNS_TOPIC_ARN: apiSnsTopic.topicArn,
                            SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
                                ssmParameters.serviceCatalogLinuxProductId.name,
                            SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
                                ssmParameters.serviceCatalogWindowsProductId.name,
                            EVENT_BUS_ARN: apiEventBus.eventBusArn,
                            EVENT_BUS_PUBLISHER_ROLE_ARN: apiEventBusPublisherRole.roleArn,
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
        apiEventBusPublisherRole,
    };
};
