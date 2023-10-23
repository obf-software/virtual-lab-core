import { EventBridgeHandler } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from '@aws-lambda-powertools/logger';
import { InstanceRepository, UserRepository, schema } from '../../../infrastructure/repositories';
import { NotifyInstanceStateChangeUseCase } from '../notify-instance-state-change';
import { AppSync } from '../../../infrastructure/aws/app-sync';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';

const { AWS_REGION, DATABASE_URL, APP_SYNC_API_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const notifyInstanceStateChangeUseCase = new NotifyInstanceStateChangeUseCase(
    logger,
    new InstanceRepository(dbClient),
    new UserRepository(dbClient),
    new AppSync(AWS_REGION, APP_SYNC_API_URL, logger),
);

export const handler = handlerAdapter<
    EventBridgeHandler<
        'EC2 Instance State-change Notification',
        { 'instance-id': string; state: string },
        void
    >
>(
    async (event) => {
        const { 'instance-id': instanceId, state } = event.detail;
        await notifyInstanceStateChangeUseCase.execute({ awsInstanceId: instanceId, state });
    },
    { isHttp: false, logger },
);
