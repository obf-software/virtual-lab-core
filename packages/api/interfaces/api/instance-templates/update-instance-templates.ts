import { z } from 'zod';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseInstanceTemplateRepository } from '../../../infrastructure/instance-template-repository/database-instance-template-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { UpdateInstanceTemplate } from '../../../application/use-cases/instance-template/update-instance-template';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, DATABASE_URL_PARAMETER_NAME } = process.env;

const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault({ AWS_REGION })
        : new LambdaLayerConfigVault({ AWS_SESSION_TOKEN });
const instanceTemplateRepository = new DatabaseInstanceTemplateRepository({
    configVault,
    DATABASE_URL_PARAMETER_NAME,
});
const updateInstanceTemplate = new UpdateInstanceTemplate(logger, auth, instanceTemplateRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const { body, path } = LambdaHandlerAdapter.parseAPIRequest({
            event,
            bodySchema: z.object({
                name: z.string().optional(),
                description: z.string().optional(),
            }),
            pathSchema: z.object({
                instanceTemplateId: z.string(),
            }),
        });

        const output = await updateInstanceTemplate.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceTemplateId: path.instanceTemplateId,
            name: body.name,
            description: body.description,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    },
    {
        logger,
    },
);
