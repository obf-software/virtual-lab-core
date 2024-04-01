import * as sst from 'sst/constructs';
import * as serviceCatalog from 'aws-cdk-lib/aws-servicecatalog';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as snssubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Config } from './Config';
import { Api } from './Api';
import { AppSyncApi } from './AppSyncApi';
import { BaseWindowsProduct } from './products/BaseWindows';
import { BaseLinuxProduct } from './products/BaseLinux';
import * as iam from 'aws-cdk-lib/aws-iam';

export const ServiceCatalog = ({ stack }: sst.StackContext) => {
    const { ssmParameters, vpc } = sst.use(Config);
    const { apiLambdaDefaultRole, apiSnsTopic, apiEventBus, apiEventBusPublisherRole } =
        sst.use(Api);
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
            'ec2:*',
            'servicecatalog:*',
            'cloudformation:*',
            'events:*',
            'scheduler:*',
        ],
        environment: {
            SHARED_SECRET_NAME: 'not-used-yet',
            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
            API_SNS_TOPIC_ARN: apiSnsTopic.topicArn,
            API_EVENT_BUS_NAME: apiEventBus.eventBusName,
            APP_SYNC_API_URL: appSyncApi.url,
            SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
                ssmParameters.serviceCatalogLinuxProductId.name,
            SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
                ssmParameters.serviceCatalogWindowsProductId.name,
            EVENT_BUS_ARN: apiEventBus.eventBusArn,
            EVENT_BUS_PUBLISHER_ROLE_ARN: apiEventBusPublisherRole.roleArn,
        },
    });
    apiSnsTopic.addSubscription(new snssubscriptions.LambdaSubscription(onLaunchStatusChange));

    const defaultPortfolio = new serviceCatalog.Portfolio(stack, 'DefaultPortfolio', {
        displayName: 'Default Portfolio',
        providerName: stack.account,
        description: 'Default Portfolio',
    });
    defaultPortfolio.giveAccessToRole(apiLambdaDefaultRole);

    const serviceCatalogSshKey = new ec2.CfnKeyPair(stack, 'ServiceCatalogSshKey', {
        keyName: `service-catalog-${stack.stage}`,
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
        productName: 'Base Linux Product',
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
            productName: 'Base Windows Product',
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
            dataType: ssm.ParameterDataType.TEXT,
            tier: ssm.ParameterTier.STANDARD,
            description: 'Service Catalog Linux Product Id',
            parameterName: ssmParameters.serviceCatalogLinuxProductId.name,
            stringValue: baseLinuxProduct.productId,
        },
    );

    const serviceCatalogWindowsProductIdParameter = new ssm.StringParameter(
        stack,
        'ServiceCatalogWindowsProductIdParameter',
        {
            dataType: ssm.ParameterDataType.TEXT,
            tier: ssm.ParameterTier.STANDARD,
            description: 'Service Catalog Windows Product Id',
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
