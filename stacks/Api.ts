import * as sst from 'sst/constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Auth } from './Auth';
import { Core } from './Core';
import { AppSyncApi } from './AppSyncApi';

export const Api = ({ stack }: sst.StackContext) => {
    const {
        ssmParameters,
        paramsAndSecretsLambdaExtension,
        defaultEventBus,
        defaultSnsTopic,
        defaultEventBusPublisherRole,
    } = sst.use(Core);
    const { userPool, userPoolClient } = sst.use(Auth);
    const { appSyncApi } = sst.use(AppSyncApi);

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

    const environment: Record<string, string> = {
        DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
        INSTANCE_PASSWORD_PARAMETER_NAME: ssmParameters.instancePassword.name,
        GUACAMOLE_CYPHER_KEY_PARAMETER_NAME: ssmParameters.guacamoleCypherKey.name,
        SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
            ssmParameters.serviceCatalogLinuxProductId.name,
        SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
            ssmParameters.serviceCatalogWindowsProductId.name,
        SNS_TOPIC_ARN: defaultSnsTopic.topicArn,
        EVENT_BUS_NAME: defaultEventBus.eventBusName,
        EVENT_BUS_ARN: defaultEventBus.eventBusArn,
        EVENT_BUS_PUBLISHER_ROLE_ARN: defaultEventBusPublisherRole.roleArn,
        APP_SYNC_API_URL: appSyncApi.url,
    };

    const permissions: sst.Permissions = [
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
        'events:*',
    ];

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
                permissions,
                environment,
                paramsAndSecrets: paramsAndSecretsLambdaExtension,
                role: apiLambdaDefaultRole,
                timeout: `15 seconds`,
            },
        },
    });

    const apiUrlParameter = new ssm.CfnParameter(stack, 'ApiUrlParameterName', {
        description: `Virtual Lab API URL - ${stack.stage}`,
        dataType: ssm.ParameterDataType.TEXT,
        tier: ssm.ParameterTier.STANDARD,
        type: 'String',
        value: api.url,
        name: ssmParameters.apiUrl.name,
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

    defaultEventBus.addRules(stack, {
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
                        permissions,
                        environment,
                        paramsAndSecrets: paramsAndSecretsLambdaExtension,
                        role: apiLambdaDefaultRole,
                        timeout: `30 seconds`,
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
                        permissions,
                        environment,
                        paramsAndSecrets: paramsAndSecretsLambdaExtension,
                        role: apiLambdaDefaultRole,
                        timeout: `30 seconds`,
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
                        permissions,
                        environment,
                        paramsAndSecrets: paramsAndSecretsLambdaExtension,
                        role: apiLambdaDefaultRole,
                        timeout: `30 seconds`,
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
                        permissions,
                        environment,
                        paramsAndSecrets: paramsAndSecretsLambdaExtension,
                        role: apiLambdaDefaultRole,
                        timeout: `30 seconds`,
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
        apiUrlParameter,
    };
};
