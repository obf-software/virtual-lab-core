import * as sst from 'sst/constructs';
import { Auth } from './Auth';
import { Config } from './Config';
import { AppSyncApi } from './AppSyncApi';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Topic } from 'aws-cdk-lib/aws-sns';

export const Api = ({ stack, app }: sst.StackContext) => {
    const { userPool, userPoolClient } = sst.use(Auth);
    const { DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD } = sst.use(Config);
    const { appSyncApi } = sst.use(AppSyncApi);

    const snsTopic = new Topic(stack, 'ServiceCatalogTopic', {
        displayName: 'API Service Catalog Topic',
    });

    const listUserProductsFunctionRole = new Role(stack, 'ListUserProductsFunctionRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
            ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess'),
            ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogAdminFullAccess'),
        ],
    });

    const getProductProvisioningParametersFunctionRole = new Role(
        stack,
        'GetProductProvisioningParametersFunctionRole',
        {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AWSLambdaVPCAccessExecutionRole',
                ),
                ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess'),
                ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogAdminFullAccess'),
            ],
        },
    );

    const provisionProductFunctionRole = new Role(stack, 'ProvisionProductFunctionRole', {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
            ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogEndUserFullAccess'),
            ManagedPolicy.fromAwsManagedPolicyName('AWSServiceCatalogAdminFullAccess'),
        ],
    });

    // TODO: arrumar isso e descobrir onde colocar
    const migrateDbScript = new sst.Script(stack, 'MigrateDbScript', {
        onCreate: 'packages/api/modules/core/handlers/migrate-database.handler',
        onUpdate: 'packages/api/modules/core/handlers/migrate-database.handler',
        defaults: {
            function: {
                environment: {
                    DATABASE_URL,
                },
                copyFiles: [
                    {
                        from: 'packages/api/infrastructure/drizzle',
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
        },
        routes: {
            // Group module
            'POST /api/v1/groups': {
                function: {
                    handler: 'packages/api/modules/group/handlers/create-group.handler',
                    permissions: ['servicecatalog:*'],
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'DELETE /api/v1/groups/{groupId}': {
                function: {
                    handler: 'packages/api/modules/group/handlers/delete-group.handler',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'GET /api/v1/groups': {
                function: {
                    handler: 'packages/api/modules/group/handlers/list-groups.handler',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'GET /api/v1/users/{userId}/groups': {
                function: {
                    handler: 'packages/api/modules/group/handlers/list-user-groups.handler',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },

            // Instance module
            'POST /api/v1/users/{userId}/instances/{instanceId}/state': {
                function: {
                    handler: 'packages/api/modules/instance/handlers/change-instance-state.handler',
                    permissions: ['ec2:*'],
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'DELETE /api/v1/users/{userId}/instances/{instanceId}': {
                function: {
                    handler: 'packages/api/modules/instance/handlers/delete-instance.handler',
                    permissions: ['ec2:*'],
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'GET /api/v1/users/{userId}/instances/{instanceId}/connection': {
                function: {
                    handler:
                        'packages/api/modules/instance/handlers/get-instance-connection.handler',
                    permissions: ['ec2:*'],
                    environment: {
                        DATABASE_URL,
                        GUACAMOLE_CYPHER_KEY,
                        INSTANCE_PASSWORD,
                    },
                },
            },
            'GET /api/v1/users/{userId}/instances': {
                function: {
                    handler: 'packages/api/modules/instance/handlers/list-user-instances.handler',
                    permissions: ['ec2:*'],
                    environment: {
                        DATABASE_URL,
                    },
                },
            },

            // Product module
            'GET /api/v1/users/{userId}/products': {
                function: {
                    handler: 'packages/api/modules/product/handlers/list-user-products.handler',
                    role: listUserProductsFunctionRole,
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'GET /api/v1/products/{productId}/provisioning-parameters': {
                function: {
                    handler:
                        'packages/api/modules/product/handlers/get-product-provisioning-parameters.handler',
                    role: getProductProvisioningParametersFunctionRole,
                    permissions: ['s3:*'],
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'POST /api/v1/products/{productId}/provision': {
                function: {
                    handler: 'packages/api/modules/product/handlers/provision-product.handler',
                    role: provisionProductFunctionRole,
                    permissions: ['s3:*'],
                    environment: {
                        DATABASE_URL,
                        SERVICE_CATALOG_NOTIFICATION_ARN: snsTopic.topicArn,
                    },
                },
            },

            // User module
            'GET /api/v1/users': {
                function: {
                    handler: 'packages/api/modules/user/handlers/list-users.handler',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'GET /api/v1/users/{userId}': {
                function: {
                    handler: 'packages/api/modules/user/handlers/get-user.handler',
                    environment: {
                        DATABASE_URL,
                    },
                },
            },
            'PATCH /api/v1/users/{userId}/role': {
                function: {
                    handler: 'packages/api/modules/user/handlers/update-user-role.handler',
                    environment: {
                        DATABASE_URL,
                    },
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
                                'packages/api/modules/instance/handlers/on-ec2-instance-state-change.handler',
                            permissions: ['ec2:*', 'appsync:GraphQL'],
                            environment: {
                                DATABASE_URL,
                                APP_SYNC_API_URL: appSyncApi.url,
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
        snsTopic,
        lambdaRoles: [
            listUserProductsFunctionRole,
            getProductProvisioningParametersFunctionRole,
            provisionProductFunctionRole,
        ],
    };
};
