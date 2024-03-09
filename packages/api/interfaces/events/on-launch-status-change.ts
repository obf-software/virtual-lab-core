import { LinkLaunchedInstance } from '../../application/use-cases/instance/link-launched-instance';
import { AWSLogger } from '../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseInstanceRepository } from '../../infrastructure/instance-repository/database-instance-repository';
import { AwsVirtualizationGateway } from '../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { DatabaseUserRepository } from '../../infrastructure/user-repository/database-user-repository';
import { AWSEventPublisher } from '../../infrastructure/event-publisher/aws-event-publisher';
import { LambdaHandlerAdapter } from '../../infrastructure/lambda-handler-adapter';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    SHARED_SECRET_NAME,
    DATABASE_URL_PARAMETER_NAME,
    API_SNS_TOPIC_ARN,
    API_EVENT_BUS_NAME,
    APP_SYNC_API_URL,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
} = process.env;
const logger = new AWSLogger();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const instanceRepository = new DatabaseInstanceRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const virtualizationGateway = new AwsVirtualizationGateway(
    configVault,
    AWS_REGION,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
);
const eventPublisher = new AWSEventPublisher(
    logger,
    AWS_REGION,
    API_EVENT_BUS_NAME,
    APP_SYNC_API_URL,
);
const linkLaunchedInstance = new LinkLaunchedInstance(
    logger,
    userRepository,
    instanceRepository,
    virtualizationGateway,
    eventPublisher,
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
export const handler = LambdaHandlerAdapter.adaptSNS(
    async (event) => {
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
                    await linkLaunchedInstance.execute({ stackName });
                }
            }),
        );
    },
    { logger },
);
