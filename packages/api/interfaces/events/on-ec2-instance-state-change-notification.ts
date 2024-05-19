import { NotifyInstanceStateChange } from '../../application/use-cases/instance/notify-instance-state-change';
import { EC2InstanceStateChangeNotification } from '../../domain/application-events/ec2-instance-state-change-notification';
import { InstanceState } from '../../domain/dtos/instance-state';
import { AWSConfigVault } from '../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../infrastructure/config-vault/lamba-layer-config-vault';
import { AWSEventPublisher } from '../../infrastructure/event-publisher/aws-event-publisher';
import { DatabaseInstanceRepository } from '../../infrastructure/instance-repository/database-instance-repository';
import { LambdaHandlerAdapter } from '../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../infrastructure/logger/aws-logger';
import { DatabaseUserRepository } from '../../infrastructure/user-repository/database-user-repository';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    DATABASE_URL_PARAMETER_NAME,
    EVENT_BUS_NAME,
    APP_SYNC_API_URL,
} = process.env;
const logger = new AWSLogger();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN);
const instanceRepository = new DatabaseInstanceRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const eventPublisher = new AWSEventPublisher(logger, AWS_REGION, EVENT_BUS_NAME, APP_SYNC_API_URL);
const notifyInstanceStateChange = new NotifyInstanceStateChange(
    logger,
    instanceRepository,
    userRepository,
    eventPublisher,
);

export const handler =
    LambdaHandlerAdapter.adaptApplicationEvent<EC2InstanceStateChangeNotification>(
        async (event) => {
            const { 'instance-id': virtualId, state: stateName } = event.detail;

            const stateMap: Record<typeof stateName, InstanceState> = {
                running: 'RUNNING',
                pending: 'PENDING',
                'shutting-down': 'SHUTTING_DOWN',
                stopped: 'STOPPED',
                stopping: 'STOPPING',
                terminated: 'TERMINATED',
            };

            await notifyInstanceStateChange.execute({
                virtualId,
                state: stateMap[stateName],
            });
        },
        { logger },
    );
