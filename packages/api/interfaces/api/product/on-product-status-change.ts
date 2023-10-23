import { SNSHandler } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { InstanceRepository, UserRepository, schema } from '../../../infrastructure/repositories';
import { LinkProvisionedProductUseCase } from '../link-provisioned-product';
import { CloudFormation } from '../../../infrastructure/aws/cloud-formation';
import { EC2 } from '../../../infrastructure/aws/ec2';
import { AppSync } from '../../../infrastructure/aws/app-sync';

const { AWS_REGION, DATABASE_URL, APP_SYNC_API_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const linkProvisionedProductUseCase = new LinkProvisionedProductUseCase(
    new CloudFormation(AWS_REGION),
    new EC2(AWS_REGION),
    new AppSync(AWS_REGION, APP_SYNC_API_URL, logger),
    new InstanceRepository(dbClient),
    new UserRepository(dbClient),
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
export const handler = handlerAdapter<SNSHandler>(
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
                    await linkProvisionedProductUseCase.execute({ stackName });
                }
            }),
        );
    },
    { isHttp: false, logger },
);
