import { RebootInstance } from '../../../application/use-cases/instance/reboot-instance';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
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
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
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
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
);
const rebootInstance = new RebootInstance(logger, auth, instanceRepository, virtualizationGateway);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        await rebootInstance.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceId: event.pathParameters?.instanceId ?? '',
        });

        return {
            statusCode: 200,
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
