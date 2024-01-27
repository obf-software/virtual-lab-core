import { EventBridgeHandler } from 'aws-lambda';
import { HandlerAdapter } from '../../infrastructure/lambda/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { NotifyInstanceStateChange } from '../../application/use-cases/instance/notify-instance-state-change';
import { InstanceDatabaseRepository } from '../../infrastructure/instance-database-repository';
import { AppsyncNotificationPublisher } from '../../infrastructure/appsync-notification-publisher';
import { UserDatabaseRepository } from '../../infrastructure/user-database-repository';
import { VirtualInstanceState } from '../../application/virtualization-gateway';
import createHttpError from 'http-errors';

const { AWS_REGION, DATABASE_URL, APP_SYNC_API_URL } = process.env;
const logger = new Logger();
const instanceRepository = new InstanceDatabaseRepository(DATABASE_URL);
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const notificationPublisher = new AppsyncNotificationPublisher(AWS_REGION, APP_SYNC_API_URL);
const notifyInstanceStateChange = new NotifyInstanceStateChange(
    logger,
    instanceRepository,
    userRepository,
    notificationPublisher,
);

export const handler = HandlerAdapter.create(logger).adapt<
    EventBridgeHandler<
        'EC2 Instance State-change Notification',
        { 'instance-id': string; state: string },
        void
    >
>(async (event) => {
    const { 'instance-id': instanceLogicalId, state: stateName } = event.detail;

    const stateMap: Record<string, keyof typeof VirtualInstanceState> = {
        pending: VirtualInstanceState.PENDING,
        running: VirtualInstanceState.RUNNING,
        'shutting-down': VirtualInstanceState.SHUTTING_DOWN,
        stopped: VirtualInstanceState.STOPPED,
        stopping: VirtualInstanceState.STOPPING,
        terminated: VirtualInstanceState.TERMINATED,
    };

    const state = stateMap[stateName?.toLowerCase() ?? ''];

    if (state === undefined) {
        throw new createHttpError.InternalServerError('Instance state not found');
    }

    await notifyInstanceStateChange.execute({
        instanceLogicalId,
        state: VirtualInstanceState[state],
    });
});
