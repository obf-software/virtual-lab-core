import * as sst from 'sst/constructs';
import * as serviceCatalog from 'aws-cdk-lib/aws-servicecatalog';
import { BaseLinuxProduct } from './products/BaseLinux';
import {
    AmazonLinuxCpuType,
    AmazonLinuxEdition,
    AmazonLinuxGeneration,
    AmazonLinuxImage,
    AmazonLinuxKernel,
    AmazonLinuxVirt,
    InstanceClass,
    InstanceSize,
    InstanceType,
    Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Config } from './Config';
import { Api } from './Api';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { AppSyncApi } from './AppSyncApi';

export const ServiceCatalog = ({ stack }: sst.StackContext) => {
    const { INSTANCE_PASSWORD, DATABASE_URL } = sst.use(Config);
    const { lambdaRoles, snsTopic } = sst.use(Api);
    const { appSyncApi } = sst.use(AppSyncApi);

    const onProductLaunchComplete = new sst.Function(stack, 'onProductLaunchComplete', {
        handler: 'packages/api/interfaces/events/on-product-status-change.handler',
        permissions: ['cloudformation:*', 'ec2:*', 'appsync:GraphQL'],
        environment: {
            DATABASE_URL,
            APP_SYNC_API_URL: appSyncApi.url,
        },
    });

    snsTopic.addSubscription(new LambdaSubscription(onProductLaunchComplete));

    const vpc = Vpc.fromLookup(stack, `DefaultVpc`, { isDefault: true });

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
                            password: INSTANCE_PASSWORD,
                            allowedInstanceTypes: [
                                InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
                            ],
                            defaultInstanceType: InstanceType.of(
                                InstanceClass.T2,
                                InstanceSize.MICRO,
                            ),
                            machineImage: new AmazonLinuxImage({
                                edition: AmazonLinuxEdition.STANDARD,
                                generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
                                cpuType: AmazonLinuxCpuType.X86_64,
                                virtualization: AmazonLinuxVirt.HVM,
                                kernel: AmazonLinuxKernel.KERNEL5_X,
                            }),
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
};
