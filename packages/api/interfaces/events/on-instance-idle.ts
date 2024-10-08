import { AutoTurnInstanceOff } from '../../application/use-cases/instance/auto-turn-instance-off';
import { InstanceIdle } from '../../domain/application-events/instance-idle';
import { AWSConfigVault } from '../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseInstanceRepository } from '../../infrastructure/instance-repository/database-instance-repository';
import { LambdaHandlerAdapter } from '../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../infrastructure/logger/aws-logger';
import { AwsVirtualizationGateway } from '../../infrastructure/virtualization-gateway/aws-virtualization-gateway';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    DATABASE_URL_PARAMETER_NAME,
    SNS_TOPIC_ARN,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
    EVENT_BUS_ARN,
    EVENT_BUS_PUBLISHER_ROLE_ARN,
    AWS_ACCOUNT_ID,
} = process.env;
const logger = new AWSLogger();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault({ AWS_REGION })
        : new LambdaLayerConfigVault({ AWS_SESSION_TOKEN });
const instanceRepository = new DatabaseInstanceRepository({
    configVault,
    DATABASE_URL_PARAMETER_NAME,
});
const virtualizationGateway = new AwsVirtualizationGateway({
    logger,
    configVault,
    AWS_REGION,
    SNS_TOPIC_ARN,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
    EVENT_BUS_ARN,
    EVENT_BUS_PUBLISHER_ROLE_ARN,
    AWS_ACCOUNT_ID,
});
const autoTurnInstanceOff = new AutoTurnInstanceOff(
    logger,
    instanceRepository,
    virtualizationGateway,
);

export const handler = LambdaHandlerAdapter.adaptApplicationEvent<InstanceIdle>(
    async (event) => {
        const { virtualId } = event.detail;
        await autoTurnInstanceOff.execute({ virtualId });
    },
    { logger },
);
