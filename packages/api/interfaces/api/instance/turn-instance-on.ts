import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { TurnInstanceOn } from '../../../application/use-cases/instance/turn-instance-on';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    SHARED_SECRET_NAME,
    DATABASE_URL_PARAMETER_NAME,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
} = process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const instanceRepository = new DatabaseInstanceRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const virtualizationGateway = new AwsVirtualizationGateway(
    configVault,
    AWS_REGION,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
);
const turnInstanceOn = new TurnInstanceOn(logger, auth, instanceRepository, virtualizationGateway);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const output = await turnInstanceOn.execute({
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
