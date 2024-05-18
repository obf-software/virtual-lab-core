import * as sst from 'sst/constructs';
import * as serviceCatalog from 'aws-cdk-lib/aws-servicecatalog';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as snssubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Core } from './Core';
import { Api } from './Api';
import { AppSyncApi } from './AppSyncApi';
import { BaseWindowsProduct } from './products/BaseWindows';
import { BaseLinuxProduct } from './products/BaseLinux';

export const ServiceCatalog = ({ stack }: sst.StackContext) => {
    const {
        ssmParameters,
        vpc,
        defaultEventBus,
        defaultSnsTopic,
        defaultEventBusPublisherRole,
        paramsAndSecretsLambdaExtension,
    } = sst.use(Core);
    const { apiLambdaDefaultRole } = sst.use(Api);
    const { appSyncApi } = sst.use(AppSyncApi);

    const scriptsBucket = new sst.Bucket(stack, 'ScriptsBucket');

    new s3deployment.BucketDeployment(stack, 'ServiceCatalogScriptsDeployment', {
        destinationBucket: scriptsBucket.cdk.bucket,
        sources: [s3deployment.Source.asset('stacks/scripts')],
    });

    const onLaunchStatusChange = new sst.Function(stack, 'onLaunchStatusChange', {
        handler: 'packages/api/interfaces/events/on-launch-status-change.handler',
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
            'events:*',
        ],
        environment: {
            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
            SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
                ssmParameters.serviceCatalogLinuxProductId.name,
            SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
                ssmParameters.serviceCatalogWindowsProductId.name,
            SNS_TOPIC_ARN: defaultSnsTopic.topicArn,
            EVENT_BUS_NAME: defaultEventBus.eventBusName,
            EVENT_BUS_ARN: defaultEventBus.eventBusArn,
            EVENT_BUS_PUBLISHER_ROLE_ARN: defaultEventBusPublisherRole.roleArn,
            APP_SYNC_API_URL: appSyncApi.url,
        },
        paramsAndSecrets: paramsAndSecretsLambdaExtension,
        timeout: '30 seconds',
    });

    defaultSnsTopic.addSubscription(new snssubscriptions.LambdaSubscription(onLaunchStatusChange));

    const defaultPortfolio = new serviceCatalog.Portfolio(stack, 'DefaultPortfolio', {
        displayName: `Virtual Lab Default Portfolio - ${stack.stage}`,
        providerName: stack.account,
    });

    defaultPortfolio.giveAccessToRole(apiLambdaDefaultRole);

    const serviceCatalogSshKey = new ec2.CfnKeyPair(stack, 'ServiceCatalogSshKey', {
        keyName: `virtual-lab-service-catalog-${stack.stage}`,
    });

    const productInstanceRole = new iam.Role(stack, 'ServiceCatalogProductInstanceRole', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        inlinePolicies: {
            accessToScriptsBucket: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        actions: ['s3:GetObject', 's3:HeadObject'],
                        resources: [scriptsBucket.bucketArn + '/*'],
                    }),
                ],
            }),
        },
    });

    const productInstanceRoleInstanceProfile = new iam.InstanceProfile(
        stack,
        'ServiceCatalogProductInstanceRoleInstanceProfile',
        { role: productInstanceRole },
    );

    const baseLinuxProduct = new serviceCatalog.CloudFormationProduct(stack, 'BaseLinuxProduct', {
        owner: 'SST',
        productName: `Virtual Lab Base Linux Product - ${stack.stage}`,
        productVersions: [
            {
                productVersionName: 'latest',
                validateTemplate: true,
                cloudFormationTemplate: serviceCatalog.CloudFormationTemplate.fromProductStack(
                    new BaseLinuxProduct(stack, 'BaseLinuxProductVersion', {
                        role: productInstanceRole,
                        instanceProfileName: productInstanceRoleInstanceProfile.instanceProfileName,
                        vpc,
                        region: stack.region,
                        userDataS3FileKey: 'base-linux-user-data.sh',
                        userDataS3FileBucket: scriptsBucket.cdk.bucket,
                        passwordSsmParameterName: ssmParameters.instancePassword.name,
                        sshKeyName: serviceCatalogSshKey.keyName,
                        connectionProxyIpv4Cidr: undefined,
                        connectionProxyIpv6Cidr: undefined,
                    }),
                ),
            },
        ],
    });

    const baseWindowsProduct = new serviceCatalog.CloudFormationProduct(
        stack,
        'BaseWindowsProduct',
        {
            owner: 'SST',
            productName: `Virtual Lab Base Windows Product - ${stack.stage}`,
            productVersions: [
                {
                    productVersionName: 'latest',
                    validateTemplate: true,
                    cloudFormationTemplate: serviceCatalog.CloudFormationTemplate.fromProductStack(
                        new BaseWindowsProduct(stack, 'BaseWindowsProductVersion', {
                            role: productInstanceRole,
                            instanceProfileName:
                                productInstanceRoleInstanceProfile.instanceProfileName,
                            vpc,
                            region: stack.region,
                            userDataS3FileKey: 'base-windows-user-data.ps1',
                            userDataS3FileBucket: scriptsBucket.cdk.bucket,
                            passwordSsmParameterName: ssmParameters.instancePassword.name,
                            sshKeyName: serviceCatalogSshKey.keyName,
                            connectionProxyIpv4Cidr: undefined,
                            connectionProxyIpv6Cidr: undefined,
                        }),
                    ),
                },
            ],
        },
    );

    defaultPortfolio.addProduct(baseLinuxProduct);
    defaultPortfolio.addProduct(baseWindowsProduct);

    const serviceCatalogLinuxProductIdParameter = new ssm.StringParameter(
        stack,
        'ServiceCatalogLinuxProductIdParameter',
        {
            description: `Virtual Lab Service Catalog Linux Product Id - ${stack.stage}`,
            dataType: ssm.ParameterDataType.TEXT,
            tier: ssm.ParameterTier.STANDARD,
            parameterName: ssmParameters.serviceCatalogLinuxProductId.name,
            stringValue: baseLinuxProduct.productId,
        },
    );

    const serviceCatalogWindowsProductIdParameter = new ssm.StringParameter(
        stack,
        'ServiceCatalogWindowsProductIdParameter',
        {
            description: `Virtual Lab Service Catalog Windows Product Id - ${stack.stage}`,
            dataType: ssm.ParameterDataType.TEXT,
            tier: ssm.ParameterTier.STANDARD,
            parameterName: ssmParameters.serviceCatalogWindowsProductId.name,
            stringValue: baseWindowsProduct.productId,
        },
    );

    return {
        defaultPortfolio,
        serviceCatalogLinuxProductIdParameter,
        serviceCatalogWindowsProductIdParameter,
    };
};
