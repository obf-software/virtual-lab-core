import { SNSHandler } from 'aws-lambda';
import { createHandler, logger } from '../../../integrations/powertools';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { AwsServiceCatalogIntegration } from '../../../integrations/aws-service-catalog/service';
import { GroupRepository } from '../../group/repository';
import { GroupService } from '../../group/service';
import { ProductService } from '../service';
import * as schema from '../../../drizzle/schema';
import { AwsCloudformationIntegration } from '../../../integrations/aws-cloudformation/service';
import { AwsEc2Integration } from '../../../integrations/aws-ec2/service';
import { InstanceRepository } from '../../instance/repository';
import { InstanceService } from '../../instance/service';
import { GuacamoleIntegration } from '../../../integrations/guacamole/service';
import { AwsAppSyncIntegration } from '../../../integrations/aws-app-sync/service';
import { UserService } from '../../user/service';
import { UserRepository } from '../../user/repository';

// Config
const { AWS_REGION, DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD, APP_SYNC_API_URL } =
    process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Integration
const awsEc2Integration = new AwsEc2Integration({ AWS_REGION });
const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration({ AWS_REGION });
const awsCloudformationIntegration = new AwsCloudformationIntegration({ AWS_REGION });
const guacamoleIntegration = new GuacamoleIntegration();
const awsAppSyncIntegration = new AwsAppSyncIntegration({ AWS_REGION, APP_SYNC_API_URL });

// Repository
const groupRepository = new GroupRepository(dbClient);
const instanceRepository = new InstanceRepository(dbClient);
const userRepository = new UserRepository(dbClient);

// Service
const groupService = new GroupService({ awsServiceCatalogIntegration, groupRepository });
const instanceService = new InstanceService({
    awsEc2Integration,
    awsServiceCatalogIntegration,
    GUACAMOLE_CYPHER_KEY,
    guacamoleIntegration,
    INSTANCE_PASSWORD,
    instanceRepository,
});
const productService = new ProductService({
    awsServiceCatalogIntegration,
    awsEc2Integration,
    awsCloudformationIntegration,
    groupService,
    instanceService,
});
const userService = new UserService({ userRepository });

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
export const handler = createHandler<SNSHandler>(async (event) => {
    const messages = event.Records.map((record) =>
        productService.parseNotificationMessage(record.Sns.Message),
    );

    await Promise.all(
        messages.map(async (message) => {
            const { stackName, resourceStatus, resourceType } = message;

            console.log('MESSAGE ->', message);

            if (resourceType === 'AWS::CloudFormation::Stack') {
                if (!stackName || !resourceStatus) {
                    logger.error(
                        `Skipping invalid notification message: ${JSON.stringify(
                            message,
                            null,
                            2,
                        )}`,
                    );
                    return;
                }

                if (resourceStatus === 'CREATE_COMPLETE') {
                    const instance = await productService.linkProvisionedProductToUser(stackName);

                    if (!instance) {
                        logger.error(
                            `Skipping notification message, instance not found: ${JSON.stringify(
                                message,
                                null,
                                2,
                            )}`,
                        );
                        return;
                    }

                    const user = await userService.getUserById(instance.userId);

                    if (!user) {
                        logger.error(
                            `Skipping notification message, user not found: ${JSON.stringify(
                                message,
                                null,
                                2,
                            )}`,
                        );
                        return;
                    }

                    await awsAppSyncIntegration.publishEc2InstanceProvisioned({
                        username: user.username,
                        instance,
                    });
                    logger.info(
                        `Successfully linked provisioned product, stackName: "${stackName}"`,
                    );
                    return;
                }
            }
        }),
    );
}, false);
