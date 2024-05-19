import * as sst from 'sst/constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Auth } from './Auth';
import { Core } from './Core';
import { AppSyncApi } from './AppSyncApi';
import { OpenApiSpecs } from './OpenApiSpecs';

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
    const instanceModulePaths = OpenApiSpecs.addHttpApiRoutes(stack, api, {
        'DELETE /api/v1/instances/{instanceId}': {
            handler: {
                function: 'packages/api/interfaces/api/instance/delete-instance.handler',
            },
            specs: {
                summary: 'Deletar instância',
                tags: ['Instâncias'],
            },
        },
        'GET /api/v1/instances/{instanceId}/connection': {
            handler: {
                function: 'packages/api/interfaces/api/instance/get-instance-connection.handler',
            },
            specs: {
                summary: 'Obter informações de conexão',
                tags: ['Instâncias'],
            },
        },
        'POST /api/v1/instances': {
            handler: {
                function: 'packages/api/interfaces/api/instance/launch-instance.handler',
            },
            specs: {
                summary: 'Criar instância',
                tags: ['Instâncias'],
            },
        },
        'GET /api/v1/instances': {
            handler: {
                function: 'packages/api/interfaces/api/instance/list-instances.handler',
            },
            specs: {
                summary: 'Listar instâncias',
                tags: ['Instâncias'],
            },
        },
        'POST /api/v1/instances/{instanceId}/reboot': {
            handler: {
                function: 'packages/api/interfaces/api/instance/reboot-instance.handler',
            },
            specs: {
                summary: 'Reiniciar instância',
                tags: ['Instâncias'],
            },
        },
        'POST /api/v1/instances/{instanceId}/turn-off': {
            handler: {
                function: 'packages/api/interfaces/api/instance/turn-instance-off.handler',
            },
            specs: {
                summary: 'Desligar instância',
                tags: ['Instâncias'],
            },
        },
        'POST /api/v1/instances/{instanceId}/turn-on': {
            handler: {
                function: 'packages/api/interfaces/api/instance/turn-instance-on.handler',
            },
            specs: {
                summary: 'Ligar instância',
                tags: ['Instâncias'],
            },
        },
    });

    /**
     * Instance template module
     */
    const instanceTemplateModulePaths = OpenApiSpecs.addHttpApiRoutes(stack, api, {
        'POST /api/v1/instances/{instanceId}/create-instance-template': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/create-instance-template-from-instance.handler',
            },
            specs: {
                summary: 'Criar template de instância a partir de instância',
                tags: ['Templates de instâncias'],
            },
        },
        'POST /api/v1/instance-templates': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/create-instance-template.handler',
            },
            specs: {
                summary: 'Criar template de instância',
                tags: ['Templates de instâncias'],
            },
        },
        'DELETE /api/v1/instance-templates/{instanceTemplateId}': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/delete-instance-template.handler',
            },
            specs: {
                summary: 'Deletar template de instância',
                tags: ['Templates de instâncias'],
            },
        },
        'GET /api/v1/instance-templates/{instanceTemplateId}': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/get-instance-template.handler',
            },
            specs: {
                summary: 'Obter template de instância',
                tags: ['Templates de instâncias'],
            },
        },
        'GET /api/v1/instance-templates': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/list-instance-templates.handler',
            },
            specs: {
                summary: 'Listar templates de instâncias',
                tags: ['Templates de instâncias'],
            },
        },
        'PATCH /api/v1/instance-templates/{instanceTemplateId}': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/update-instance-templates.handler',
            },
            specs: {
                summary: 'Atualizar template de instância',
                tags: ['Templates de instâncias'],
            },
        },
    });

    /**
     * User module
     */
    const userModulePaths = OpenApiSpecs.addHttpApiRoutes(stack, api, {
        'GET /api/v1/users/{userId}': {
            handler: {
                function: 'packages/api/interfaces/api/user/get-user.handler',
            },
            specs: {
                summary: 'Obter usuário',
                tags: ['Usuários'],
            },
        },
        'GET /api/v1/users': {
            handler: {
                function: 'packages/api/interfaces/api/user/list-users.handler',
            },
            specs: {
                summary: 'Listar usuários',
                tags: ['Usuários'],
            },
        },
        'PATCH /api/v1/users/{userId}/quotas': {
            handler: {
                function: 'packages/api/interfaces/api/user/update-user-quotas.handler',
            },
            specs: {
                summary: 'Atualizar quotas de usuário',
                tags: ['Usuários'],
            },
        },
        'PATCH /api/v1/users/{userId}/role': {
            handler: {
                function: 'packages/api/interfaces/api/user/update-user-role.handler',
            },
            specs: {
                summary: 'Atualizar cargo de usuário',
                tags: ['Usuários'],
            },
        },
    });

    /**
     * Misc module
     */
    const miscModulePaths = OpenApiSpecs.addHttpApiRoutes(stack, api, {
        'GET /api/v1/instance-types': {
            handler: { function: 'packages/api/interfaces/api/misc/list-instance-types.handler' },
            specs: {
                summary: 'Listar tipos de instância',
                tags: ['Outros'],
            },
        },
        'GET /api/v1/recommended-machine-images': {
            handler: {
                function:
                    'packages/api/interfaces/api/misc/list-recommended-machine-images.handler',
            },
            specs: {
                summary: 'Listar imagens de máquinas recomendadas',
                tags: ['Outros'],
            },
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
        pathsObjects: [
            instanceModulePaths,
            instanceTemplateModulePaths,
            userModulePaths,
            miscModulePaths,
        ],
        apiLambdaDefaultRole,
        apiUrlParameter,
    };
};
