import { GetInstanceConnection } from '../../../application/use-cases/instance/get-instance-connection';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { GuacamoleConnectionEncoder } from '../../../infrastructure/connection-encoder/guacamole-connection-encoder';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { z } from 'zod';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    DATABASE_URL_PARAMETER_NAME,
    SNS_TOPIC_ARN,
    GUACAMOLE_CYPHER_KEY_PARAMETER_NAME,
    INSTANCE_PASSWORD_PARAMETER_NAME,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
    EVENT_BUS_ARN,
    EVENT_BUS_PUBLISHER_ROLE_ARN,
    AWS_ACCOUNT_ID,
} = process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault({ AWS_REGION })
        : new LambdaLayerConfigVault({ AWS_SESSION_TOKEN });
const instanceRepository = new DatabaseInstanceRepository({
    configVault,
    DATABASE_URL_PARAMETER_NAME,
});
const connectionEncoder = new GuacamoleConnectionEncoder({
    configVault,
    GUACAMOLE_CYPHER_KEY_PARAMETER_NAME,
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
const getInstanceConnection = new GetInstanceConnection(
    logger,
    auth,
    instanceRepository,
    connectionEncoder,
    virtualizationGateway,
    configVault,
    INSTANCE_PASSWORD_PARAMETER_NAME,
);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const { path } = LambdaHandlerAdapter.parseAPIRequest({
            event,
            pathSchema: z.object({
                instanceId: z.string(),
            }),
        });

        const output = await getInstanceConnection.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceId: path.instanceId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
