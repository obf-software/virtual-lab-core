import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
import { createHandler, logger } from '../../integrations/powertools';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer, EventBridgeHandler } from 'aws-lambda';
import { z } from 'zod';
import { InstanceRepository } from './repository';
import { InstanceService } from './service';
import { AuthService } from '../auth/service';
import { InvalidQueryParamsError } from '../core/errors';
import { AwsEc2Integration } from '../../integrations/aws-ec2/service';
import { Ec2InstanceState } from '../../integrations/aws-ec2/protocols';
import { AppSyncIntegration } from '../../integrations/app-sync/service';
import { UserRepository } from '../user/repository';
import { UserService } from '../user/service';

const { DATABASE_URL, AWS_REGION, APP_SYNC_API_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const awsEc2Integration = new AwsEc2Integration();
const appSyncIntegration = new AppSyncIntegration(AWS_REGION, APP_SYNC_API_URL);

const instanceRepository = new InstanceRepository(dbClient);
const userRepository = new UserRepository(dbClient);

const instanceService = new InstanceService(instanceRepository, awsEc2Integration);
const userService = new UserService(userRepository);
const authService = new AuthService();

export const listUserInstances = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const { role, userId } = authService.getUserPoolJwtClaims(event);
        authService.throwIfInsufficientRole('USER', role);

        const query = z
            .object({
                resultsPerPage: z.string().default('10').transform(Number),
                page: z.string().default('1').transform(Number),
            })
            .safeParse({ ...event.queryStringParameters });
        if (!query.success) throw InvalidQueryParamsError(query.error.message);
        const { resultsPerPage, page } = query.data;

        const result = await instanceService.listUserInstances(userId, { resultsPerPage, page });

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    true,
);

export const onEc2InstanceStateChange = createHandler<
    EventBridgeHandler<
        'EC2 Instance State-change Notification',
        { 'instance-id': string; state: keyof typeof Ec2InstanceState },
        void
    >
>(async (event) => {
    const { 'instance-id': instanceId, state } = event.detail;

    const instance = await instanceService.getInstanceByAwsInstanceId(instanceId);

    if (instance === undefined) {
        logger.debug(`Instance ${instanceId} not found in database, skipping notification`);
        return;
    }

    const user = await userService.getUserById(instance.userId);

    if (user === undefined) {
        logger.error(`Instance ${instanceId} has no user associated, skipping notification`);
        return;
    }

    await appSyncIntegration.publishEc2InstanceStateChanged({
        username: user.username,
        id: instance.id,
        awsInstanceId: instance.awsInstanceId,
        name: instance.name,
        state,
    });
});
