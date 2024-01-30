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

export const ServiceCatalog = ({ stack }: sst.StackContext) => {
    const { ssmParameters, vpc } = sst.use(Config);
    const { apiLambdaDefaultRole, apiSnsTopic, apiEventBus } = sst.use(Api);
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
        ],
        environment: {
            SHARED_SECRET_NAME: 'not-used-yet',
            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
            API_SNS_TOPIC_ARN: apiSnsTopic.topicArn,
            SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME:
                ssmParameters.serviceCatalogPortfolioId.name,
            API_EVENT_BUS_NAME: apiEventBus.eventBusName,
            APP_SYNC_API_URL: appSyncApi.url,
        },
    });
    apiSnsTopic.addSubscription(new snssubscriptions.LambdaSubscription(onLaunchStatusChange));

    const defaultPortfolio = new serviceCatalog.Portfolio(stack, 'DefaultPortfolio', {
        displayName: 'Default Portfolio',
        providerName: stack.account,
        description: 'Default Portfolio',
    });
    defaultPortfolio.giveAccessToRole(apiLambdaDefaultRole);

    const serviceCatalogPortfolioIdParameter = new ssm.StringParameter(
        stack,
        'ServiceCatalogPortfolioIdParameter',
        {
            dataType: ssm.ParameterDataType.TEXT,
            tier: ssm.ParameterTier.STANDARD,
            description: 'Service Catalog Portfolio Id',
            parameterName: ssmParameters.serviceCatalogPortfolioId.name,
            stringValue: defaultPortfolio.portfolioId,
        },
    );

    const serviceCatalogSshKey = new ec2.CfnKeyPair(stack, 'ServiceCatalogSshKey', {
        keyName: `service-catalog-${stack.stage}`,
    });

    const defaultLinuxProduct = new serviceCatalog.CloudFormationProduct(
        stack,
        'DefaultLinuxProduct',
        {
            owner: 'SST',
            productName: 'Máquina Virtual Linux',
            description:
                'Configurada para uso padrão, com os seguintes softwares instalados: Google Chrome.',
            productVersions: [
                {
                    productVersionName: 'latest',
                    validateTemplate: true,
                    cloudFormationTemplate: serviceCatalog.CloudFormationTemplate.fromProductStack(
                        new BaseLinuxProduct(stack, 'DefaultLinuxProductVersion', {
                            vpc,
                            region: stack.region,
                            machineImage: new ec2.AmazonLinuxImage({
                                edition: ec2.AmazonLinuxEdition.STANDARD,
                                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
                                cpuType: ec2.AmazonLinuxCpuType.X86_64,
                                virtualization: ec2.AmazonLinuxVirt.HVM,
                                kernel: ec2.AmazonLinuxKernel.KERNEL5_X,
                            }),
                            userDataS3FileKey: 'base-linux-user-data.sh',
                            userDataS3FileBucket: scriptsBucket.cdk.bucket,
                            extraUserDataCommands: [
                                'wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm',
                                'yum -y install ./google-chrome-stable_current_*.rpm',
                            ],
                            passwordSsmParameterName: ssmParameters.instancePassword.name,
                            sshKeyName: serviceCatalogSshKey.keyName,
                        }),
                    ),
                },
            ],
        },
    );

    const defaultWindowsProduct = new serviceCatalog.CloudFormationProduct(
        stack,
        'DefaultWindowsProduct',
        {
            owner: 'SST',
            productName: 'Máquina Virtual Windows',
            description: 'Configurada para uso padrão. Não possui softwares instalados.',
            productVersions: [
                {
                    productVersionName: 'latest',
                    validateTemplate: true,
                    cloudFormationTemplate: serviceCatalog.CloudFormationTemplate.fromProductStack(
                        new BaseWindowsProduct(stack, 'DefaultWindowsProductVersion', {
                            vpc,
                            region: stack.region,
                            machineImage: new ec2.WindowsImage(
                                ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE,
                            ),
                            userDataS3FileKey: 'base-windows-user-data.ps1',
                            userDataS3FileBucket: scriptsBucket.cdk.bucket,
                            // extraUserDataCommands: [''],
                            passwordSsmParameterName: ssmParameters.instancePassword.name,
                            sshKeyName: serviceCatalogSshKey.keyName,
                        }),
                    ),
                },
            ],
        },
    );

    defaultPortfolio.addProduct(defaultLinuxProduct);
    defaultPortfolio.addProduct(defaultWindowsProduct);

    return {
        defaultPortfolio,
        serviceCatalogPortfolioIdParameter,
    };
};
