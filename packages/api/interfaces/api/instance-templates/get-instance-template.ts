import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseInstanceTemplateRepository } from '../../../infrastructure/instance-template-repository/database-instance-template-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { GetInstanceTemplate } from '../../../application/use-cases/instance-template/get-instance-template';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;

const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const instanceTemplateRepository = new DatabaseInstanceTemplateRepository(
    configVault,
    DATABASE_URL_PARAMETER_NAME,
);
const getInstanceTemplate = new GetInstanceTemplate(logger, auth, instanceTemplateRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const instanceTemplateId = event.pathParameters?.instanceTemplateId;

        const output = await getInstanceTemplate.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceTemplateId: instanceTemplateId ?? '',
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    },
    { logger },
);
