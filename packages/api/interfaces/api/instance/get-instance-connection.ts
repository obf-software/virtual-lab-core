import { GetInstanceConnection } from '../../../application/use-cases/instance/get-instance-connection';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { GuacamoleConnectionEncoder } from '../../../infrastructure/connection-encoder/guacamole-connection-encoder';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    SHARED_SECRET_NAME,
    DATABASE_URL_PARAMETER_NAME,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
    GUACAMOLE_CYPHER_KEY_PARAMETER_NAME,
    INSTANCE_PASSWORD_PARAMETER_NAME,
} = process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const instanceRepository = new DatabaseInstanceRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const connectionEncoder = new GuacamoleConnectionEncoder(
    configVault,
    GUACAMOLE_CYPHER_KEY_PARAMETER_NAME,
);
const virtualizationGateway = new AwsVirtualizationGateway(
    configVault,
    AWS_REGION,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
);
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
        const output = await getInstanceConnection.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceId: event.pathParameters?.instanceId ?? '',
        });
        await instanceRepository.disconnect();

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
