import { Logger } from '@aws-lambda-powertools/logger';
import { SNSHandler } from 'aws-lambda';
import { LinkProvisionedProduct } from '../../application/use-cases/product/link-provisioned-product';
import { UserDatabaseRepository } from '../../infrastructure/repositories/user-database-repository';
import { InstanceDatabaseRepository } from '../../infrastructure/repositories/instance-database-repository';
import { AwsVirtualizationGateway } from '../../infrastructure/aws-virtualization-gateway';
import { AwsCatalogGateway } from '../../infrastructure/aws-catalog-gateway';
import { AppsyncNotificationPublisher } from '../../infrastructure/appsync-notification-publisher';
import { HandlerAdapter } from '../../infrastructure/lambda/handler-adapter';

const { AWS_REGION, DATABASE_URL, APP_SYNC_API_URL, SERVICE_CATALOG_NOTIFICATION_ARN } =
    process.env;
const logger = new Logger();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const instanceRepository = new InstanceDatabaseRepository(DATABASE_URL);
const virtualizationGateway = new AwsVirtualizationGateway(AWS_REGION);
const catalogGateway = new AwsCatalogGateway(AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN);
const notificationPublisher = new AppsyncNotificationPublisher(AWS_REGION, APP_SYNC_API_URL);
const linkProvisionedProduct = new LinkProvisionedProduct(
    logger,
    userRepository,
    instanceRepository,
    virtualizationGateway,
    catalogGateway,
    notificationPublisher,
);

/**
 * Example Message:
 * StackId='arn:aws:cloudformation:us-east-1:154317023037:stack/SC-154317023037-pp-kka5k6yluzrdg/9aae5050-5e4a-11ee-8983-0aaa8356ff9f'
 * Timestamp='2023-09-28T22:04:31.607Z'
 * EventId='00551c40-5e4b-11ee-a58b-0ad65c6599e9'
 * LogicalResourceId='SC-154317023037-pp-kka5k6yluzrdg'
 * Namespace='154317023037'
 * PhysicalResourceId='arn:aws:cloudformation:us-east-1:154317023037:stack/SC-154317023037-pp-kka5k6yluzrdg/9aae5050-5e4a-11ee-8983-0aaa8356ff9f'
 * PrincipalId='AIDASH3QC446RTORJGVLW'
 * ResourceProperties='null'
 * ResourceStatus='CREATE_COMPLETE'
 * ResourceStatusReason=''
 * ResourceType='AWS::CloudFormation::Stack'
 * StackName='SC-154317023037-pp-kka5k6yluzrdg'
 * ClientRequestToken='b6ef1b25-a648-44b6-b426-1b6100e7d903'
 */
export const handler = HandlerAdapter.create(logger).adapt<SNSHandler>(async (event) => {
    const messages = event.Records.map((record) => {
        const parserTemplate = {
            stackName: `StackName='(.*)'`,
            resourceStatus: `ResourceStatus='(.*)'`,
            resourceType: `ResourceType='(.*)'`,
        };

        Object.entries(parserTemplate).forEach(([key, rawRegex]) => {
            const regex = new RegExp(rawRegex);
            const match = record.Sns.Message.match(regex);
            parserTemplate[key as keyof typeof parserTemplate] = match ? match[1] : '';
        });

        return parserTemplate;
    });

    await Promise.allSettled(
        messages.map(async ({ resourceStatus, resourceType, stackName }) => {
            if (
                resourceType === 'AWS::CloudFormation::Stack' &&
                resourceStatus === 'CREATE_COMPLETE'
            ) {
                await linkProvisionedProduct.execute({ provisionedProductStackName: stackName });
            }
        }),
    );
});
