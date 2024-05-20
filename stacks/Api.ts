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
                description:
                    'Deleta a instância e todos os recursos associados a ela permanentemente',
                tags: ['Instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceIdPathParameter' }],
                responses: {
                    '204': {
                        description: 'Instância deletada com sucesso',
                    },
                    '400': { $ref: '#/components/responses/400' },
                    '401': { $ref: '#/components/responses/401' },
                    '403': { $ref: '#/components/responses/403' },
                    '404': { $ref: '#/components/responses/404' },
                },
            },
        },
        'GET /api/v1/instances/{instanceId}/connection': {
            handler: {
                function: 'packages/api/interfaces/api/instance/get-instance-connection.handler',
            },
            specs: {
                summary: 'Obter informações de conexão',
                description:
                    'Obtém as informações necessárias para iniciar uma conexão com a instância',
                tags: ['Instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceIdPathParameter' }],
                responses: {
                    '200': {
                        description: 'Informações de conexão obtidas com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        connectionString: {
                                            type: 'string',
                                            description: 'String de conexão para a instância',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/400' },
                    '401': { $ref: '#/components/responses/401' },
                    '403': { $ref: '#/components/responses/403' },
                    '404': { $ref: '#/components/responses/404' },
                },
            },
        },
        'POST /api/v1/instances': {
            handler: {
                function: 'packages/api/interfaces/api/instance/launch-instance.handler',
            },
            specs: {
                summary: 'Criar instância',
                description: 'Cria uma instância de acordo com os parâmetros informados',
                tags: ['Instâncias'],
                security: [{ UserPool: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: [
                                    'name',
                                    'description',
                                    'templateId',
                                    'instanceType',
                                    'canHibernate',
                                ],
                                properties: {
                                    ownerId: {
                                        type: 'string',
                                        description:
                                            'Id do dono da instância. Caso seja "me", o dono será o usuário autenticado',
                                    },
                                    name: {
                                        type: 'string',
                                        description: 'Nome da instância',
                                    },
                                    description: {
                                        type: 'string',
                                        description: 'Descrição da instância',
                                    },
                                    templateId: {
                                        type: 'string',
                                        description: 'Id do template de instância a ser utilizado',
                                    },
                                    instanceType: {
                                        type: 'string',
                                        description: 'Tipo de instância',
                                    },
                                    canHibernate: {
                                        type: 'boolean',
                                        description: 'Se a instância pode hibernar',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Instância criada com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Instance',
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/400' },
                    '401': { $ref: '#/components/responses/401' },
                    '403': { $ref: '#/components/responses/403' },
                    '404': { $ref: '#/components/responses/404' },
                },
            },
        },
        'GET /api/v1/instances': {
            handler: {
                function: 'packages/api/interfaces/api/instance/list-instances.handler',
            },
            specs: {
                summary: 'Listar instâncias',
                description: 'Lista todas as instâncias que satisfazem os filtros informados',
                tags: ['Instâncias'],
                security: [{ UserPool: [] }],
                parameters: [
                    {
                        in: 'query',
                        name: 'orderBy',
                        description: 'Campo pelo qual a lista será ordenada',
                        required: false,
                        schema: {
                            type: 'string',
                            enum: ['creationDate', 'lastConnectionDate', 'alphabetical'],
                            default: 'creationDate',
                        },
                    },
                    {
                        $ref: '#/components/parameters/PaginationOrderQueryParameter',
                        required: false,
                    },
                    {
                        in: 'query',
                        name: 'ownerId',
                        description: 'Filtrar instâncias pelo id do dono',
                        required: false,
                        schema: {
                            type: 'string',
                            $ref: '#/components/schemas/Id',
                        },
                    },
                    {
                        $ref: '#/components/parameters/TextSearchQueryParameter',
                        required: false,
                    },
                ],
                responses: {
                    '200': {
                        description: 'Instâncias listadas com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    allOf: [
                                        { $ref: '#/components/schemas/SeekPaginated' },
                                        {
                                            type: 'object',
                                            description: 'Lista de instâncias',
                                            properties: {
                                                data: {
                                                    type: 'array',
                                                    items: {
                                                        $ref: '#/components/schemas/Instance',
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/400' },
                    '401': { $ref: '#/components/responses/401' },
                    '403': { $ref: '#/components/responses/403' },
                },
            },
        },
        'POST /api/v1/instances/{instanceId}/reboot': {
            handler: {
                function: 'packages/api/interfaces/api/instance/reboot-instance.handler',
            },
            specs: {
                summary: 'Reiniciar instância',
                description: 'Reinicia a instância caso ela esteja ligada',
                tags: ['Instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceIdPathParameter' }],
                responses: {
                    '204': {
                        description: 'Instância reiniciada com sucesso',
                    },
                    '400': { $ref: '#/components/responses/400' },
                    '401': { $ref: '#/components/responses/401' },
                    '403': { $ref: '#/components/responses/403' },
                    '404': { $ref: '#/components/responses/404' },
                },
            },
        },
        'POST /api/v1/instances/{instanceId}/turn-off': {
            handler: {
                function: 'packages/api/interfaces/api/instance/turn-instance-off.handler',
            },
            specs: {
                summary: 'Desligar instância',
                description: 'Desliga a instância caso ela esteja ligada',
                tags: ['Instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceIdPathParameter' }],
                responses: {
                    '200': {
                        description: 'Processo de desligamento iniciado com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        state: {
                                            $ref: '#/components/schemas/InstanceState',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/400' },
                    '401': { $ref: '#/components/responses/401' },
                    '403': { $ref: '#/components/responses/403' },
                    '404': { $ref: '#/components/responses/404' },
                },
            },
        },
        'POST /api/v1/instances/{instanceId}/turn-on': {
            handler: {
                function: 'packages/api/interfaces/api/instance/turn-instance-on.handler',
            },
            specs: {
                summary: 'Ligar instância',
                description: 'Liga a instância caso ela esteja desligada',
                tags: ['Instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceIdPathParameter' }],
                responses: {
                    '200': {
                        description: 'Processo de inicialização da instância iniciado com sucesso',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        state: {
                                            $ref: '#/components/schemas/InstanceState',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/400' },
                    '401': { $ref: '#/components/responses/401' },
                    '403': { $ref: '#/components/responses/403' },
                    '404': { $ref: '#/components/responses/404' },
                },
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
                description:
                    'A partir de uma instância existente, cria um template de instância com as configurações atuais da instância',
                tags: ['Templates de instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceIdPathParameter' }],
            },
        },
        'POST /api/v1/instance-templates': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/create-instance-template.handler',
            },
            specs: {
                summary: 'Criar template de instância',
                description: 'Cria um template de instância com as configurações informadas',
                tags: ['Templates de instâncias'],
                security: [{ UserPool: [] }],
            },
        },
        'DELETE /api/v1/instance-templates/{instanceTemplateId}': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/delete-instance-template.handler',
            },
            specs: {
                summary: 'Deletar template de instância',
                description: 'Deleta o template de instância permanentemente',
                tags: ['Templates de instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceTemplateIdPathParameter' }],
            },
        },
        'GET /api/v1/instance-templates/{instanceTemplateId}': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/get-instance-template.handler',
            },
            specs: {
                summary: 'Obter template de instância',
                description: 'Obtém as informações do template de instância',
                tags: ['Templates de instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceTemplateIdPathParameter' }],
            },
        },
        'GET /api/v1/instance-templates': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/list-instance-templates.handler',
            },
            specs: {
                summary: 'Listar templates de instâncias',
                description:
                    'Lista todos os templates de instâncias que satisfazem os filtros informados',
                tags: ['Templates de instâncias'],
                security: [{ UserPool: [] }],
            },
        },
        'PATCH /api/v1/instance-templates/{instanceTemplateId}': {
            handler: {
                function:
                    'packages/api/interfaces/api/instance-templates/update-instance-templates.handler',
            },
            specs: {
                summary: 'Atualizar template de instância',
                description: 'Atualiza as informações do template de instância',
                tags: ['Templates de instâncias'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/InstanceTemplateIdPathParameter' }],
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
                description:
                    "Obtém as informações do usuário. Caso o id do usuário seja 'me', retorna as informações do usuário autenticado",
                tags: ['Usuários'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/UserIdPathParameter' }],
            },
        },
        'GET /api/v1/users': {
            handler: {
                function: 'packages/api/interfaces/api/user/list-users.handler',
            },
            specs: {
                summary: 'Listar usuários',
                description: 'Lista todos os usuários que satisfazem os filtros informados',
                tags: ['Usuários'],
                security: [{ UserPool: [] }],
            },
        },
        'PATCH /api/v1/users/{userId}/quotas': {
            handler: {
                function: 'packages/api/interfaces/api/user/update-user-quotas.handler',
            },
            specs: {
                summary: 'Atualizar quotas de usuário',
                description:
                    "Atualiza as quotas do usuário. Caso o id do usuário seja 'me', atualiza as quotas do usuário autenticado",
                tags: ['Usuários'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/UserIdPathParameter' }],
            },
        },
        'PATCH /api/v1/users/{userId}/role': {
            handler: {
                function: 'packages/api/interfaces/api/user/update-user-role.handler',
            },
            specs: {
                summary: 'Atualizar cargo de usuário',
                description:
                    "Atualiza o cargo do usuário. Caso o id do usuário seja 'me', atualiza o cargo do usuário autenticado",
                tags: ['Usuários'],
                security: [{ UserPool: [] }],
                parameters: [{ $ref: '#/components/parameters/UserIdPathParameter' }],
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
                description: 'Lista todos os tipos de instância disponíveis',
                tags: ['Outros'],
                security: [{ UserPool: [] }],
            },
        },
        'GET /api/v1/recommended-machine-images': {
            handler: {
                function:
                    'packages/api/interfaces/api/misc/list-recommended-machine-images.handler',
            },
            specs: {
                summary: 'Listar imagens de máquinas recomendadas',
                description:
                    'Lista todas as imagens de máquinas recomendadas para criação de templates de instância',
                tags: ['Outros'],
                security: [{ UserPool: [] }],
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
