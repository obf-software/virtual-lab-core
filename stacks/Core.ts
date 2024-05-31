import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sst from 'sst/constructs';
import * as events from 'aws-cdk-lib/aws-events';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export const Core = ({ stack }: sst.StackContext) => {
    const ssmParameters = {
        apiUrl: {
            name: `/virtual-lab/${stack.stage}/api-url`,
        },
        databaseUrl: {
            name: `/virtual-lab/${stack.stage}/database-url`,
        },
        instancePassword: {
            name: `/virtual-lab/${stack.stage}/instance-password`,
        },
        guacamoleCypherKey: {
            name: `/virtual-lab/${stack.stage}/guacamole-cypher-key`,
        },
        serviceCatalogLinuxProductId: {
            name: `/virtual-lab/${stack.stage}/service-catalog-linux-product-id`,
        },
        serviceCatalogWindowsProductId: {
            name: `/virtual-lab/${stack.stage}/service-catalog-windows-product-id`,
        },
    } satisfies Record<string, { name: string }>;

    new ssm.StringParameter(stack, 'CoreDatabaseUrlParameter', {
        parameterName: ssmParameters.databaseUrl.name,
        description: `Virtual Lab Database URL - ${stack.stage}`,
        dataType: ssm.ParameterDataType.TEXT,
        stringValue: 'CHANGE_ME',
    });

    new ssm.StringParameter(stack, 'CoreInstancePasswordParameter', {
        parameterName: ssmParameters.instancePassword.name,
        description: `Virtual Lab Instance Password - ${stack.stage}`,
        dataType: ssm.ParameterDataType.TEXT,
        stringValue: 'CHANGE_ME',
    });

    new ssm.StringParameter(stack, 'CoreGuacamoleCypherKeyParameter', {
        parameterName: ssmParameters.guacamoleCypherKey.name,
        description: `Virtual Lab Guacamole Cypher Key - ${stack.stage}`,
        allowedPattern: '^.{32}$',
        dataType: ssm.ParameterDataType.TEXT,
        stringValue: 'CHANGE_ME-CHANGE_ME-CHANGE_ME-CH',
    });

    const paramsAndSecretsLambdaExtension = lambda.ParamsAndSecretsLayerVersion.fromVersion(
        lambda.ParamsAndSecretsVersions.V1_0_103,
        {
            cacheEnabled: true,
            cacheSize: 1000,
            logLevel: lambda.ParamsAndSecretsLogLevel.INFO,
            httpPort: 2773,
            maxConnections: 1000,
            parameterStoreTtl: cdk.Duration.seconds(300),
            parameterStoreTimeout: cdk.Duration.seconds(10),
            secretsManagerTtl: cdk.Duration.seconds(300),
            secretsManagerTimeout: cdk.Duration.seconds(10),
        },
    );

    const defaultSnsTopic = new sns.Topic(stack, 'CoreDefaultSnsTopic', {
        displayName: `Virtual Lab Default SNS Topic - ${stack.stage}`,
    });

    const defaultEventBus = new sst.EventBus(stack, 'CoreDefaultEventBus', {
        cdk: {
            eventBus: events.EventBus.fromEventBusName(
                stack,
                'CoreDefaultEventBusImport',
                'default',
            ),
        },
    });

    const defaultEventBusPublisherRole = new iam.Role(stack, 'CoreDefaultEventBusPublisherRole', {
        assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
        inlinePolicies: {
            PutEvents: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        actions: ['events:PutEvents'],
                        resources: [defaultEventBus.eventBusArn],
                    }),
                ],
            }),
        },
    });

    const vpc = ec2.Vpc.fromLookup(stack, `CoreDefaultVpcImport`, { isDefault: true });

    return {
        ssmParameters,
        paramsAndSecretsLambdaExtension,
        defaultSnsTopic,
        defaultEventBus,
        defaultEventBusPublisherRole,
        vpc,
    };
};
