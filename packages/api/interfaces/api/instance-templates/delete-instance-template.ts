import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseInstanceTemplateRepository } from '../../../infrastructure/instance-template-repository/database-instance-template-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { DeleteInstanceTemplate } from '../../../application/use-cases/instance-template/delete-instance-template';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, DATABASE_URL_PARAMETER_NAME } = process.env;

const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN);
const instanceTemplateRepository = new DatabaseInstanceTemplateRepository(
    configVault,
    DATABASE_URL_PARAMETER_NAME,
);
const deleteInstanceTemplate = new DeleteInstanceTemplate(logger, auth, instanceTemplateRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const instanceTemplateId = event.pathParameters?.instanceTemplateId;

        await deleteInstanceTemplate.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceTemplateId: instanceTemplateId ?? '',
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Instance template deleted' }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    },
    { logger },
);
