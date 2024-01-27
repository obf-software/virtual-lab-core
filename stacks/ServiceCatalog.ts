import * as sst from 'sst/constructs';
import * as serviceCatalog from 'aws-cdk-lib/aws-servicecatalog';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as snssubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Config } from './Config';
import { Api } from './Api';
import { AppSyncApi } from './AppSyncApi';
import { BaseWindowsProduct } from './products/BaseWindows';
import { BaseLinuxProduct } from './products/BaseLinux';

export const ServiceCatalog = ({ stack }: sst.StackContext) => {
    const { ssmParameters } = sst.use(Config);
    const { lambdaRoles, snsTopic } = sst.use(Api);
    const { appSyncApi } = sst.use(AppSyncApi);

    const scriptsBucket = new sst.Bucket(stack, 'ScriptsBucket');

    const baseLinuxUserDataDeployment = new s3deployment.BucketDeployment(
        stack,
        'BaseLinuxUserDataDeployment',
        {
            destinationBucket: scriptsBucket.cdk.bucket,
            sources: [s3deployment.Source.asset('stacks/scripts/base-linux-user-data.sh')],
        },
    );

    const baseWindowsUserDataDeployment = new s3deployment.BucketDeployment(
        stack,
        'BaseWindowsUserDataDeployment',
        {
            destinationBucket: scriptsBucket.cdk.bucket,
            sources: [s3deployment.Source.asset('stacks/scripts/base-windows-user-data.ps1')],
        },
    );

    const onProductLaunchComplete = new sst.Function(stack, 'onProductLaunchComplete', {
        handler: 'packages/api/interfaces/events/on-product-status-change.handler',
        permissions: ['cloudformation:*', 'ec2:*', 'appsync:GraphQL'],
        environment: {
            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
            APP_SYNC_API_URL: appSyncApi.url,
        },
    });

    snsTopic.addSubscription(new snssubscriptions.LambdaSubscription(onProductLaunchComplete));

    const vpc = ec2.Vpc.fromLookup(stack, `DefaultVpc`, { isDefault: true });

    const defaultLinuxProduct = new serviceCatalog.CloudFormationProduct(
        stack,
        'DefaultLinuxProduct',
        {
            owner: 'SST',
            productName: 'Default Linux Product',
            description: 'Default Linux Product',
            productVersions: [
                {
                    productVersionName: 'latest',
                    cloudFormationTemplate: serviceCatalog.CloudFormationTemplate.fromProductStack(
                        new BaseLinuxProduct(stack, 'DefaultLinuxProductVersion', {
                            vpc,
                            allowedInstanceTypes: [
                                ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
                                ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
                            ],
                            defaultInstanceType: ec2.InstanceType.of(
                                ec2.InstanceClass.T2,
                                ec2.InstanceSize.MICRO,
                            ),
                            machineImage: new ec2.AmazonLinuxImage({
                                edition: ec2.AmazonLinuxEdition.STANDARD,
                                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
                                cpuType: ec2.AmazonLinuxCpuType.X86_64,
                                virtualization: ec2.AmazonLinuxVirt.HVM,
                                kernel: ec2.AmazonLinuxKernel.KERNEL5_X,
                            }),
                            passwordSsmParameterName: ssmParameters.instancePassword.name,
                        }),
                    ),
                    validateTemplate: true,
                },
            ],
        },
    );

    const defaultWindowsProduct = new serviceCatalog.CloudFormationProduct(
        stack,
        'DefaultWindowsProduct',
        {
            owner: 'SST',
            productName: 'Default Windows Product',
            description: 'Default Windows Product',
            productVersions: [
                {
                    productVersionName: 'latest',
                    cloudFormationTemplate: serviceCatalog.CloudFormationTemplate.fromProductStack(
                        new BaseWindowsProduct(stack, 'DefaultWindowsProductVersion', {
                            vpc,
                            allowedInstanceTypes: [
                                ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
                            ],
                            defaultInstanceType: ec2.InstanceType.of(
                                ec2.InstanceClass.T3,
                                ec2.InstanceSize.MICRO,
                            ),
                            machineImage: new ec2.WindowsImage(
                                ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE,
                            ),
                            passwordSsmParameterName: ssmParameters.instancePassword.name,
                        }),
                    ),
                    validateTemplate: true,
                },
            ],
        },
    );

    const defaultPortfolio = new serviceCatalog.Portfolio(stack, 'DefaultPortfolio', {
        displayName: 'Default Portfolio',
        providerName: stack.account,
    });

    lambdaRoles.forEach((role) => {
        defaultPortfolio.giveAccessToRole(role);
    });

    defaultPortfolio.addProduct(defaultLinuxProduct);
    defaultPortfolio.addProduct(defaultWindowsProduct);
};
