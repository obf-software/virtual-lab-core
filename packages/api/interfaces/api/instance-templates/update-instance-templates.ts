import { z } from 'zod';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseInstanceTemplateRepository } from '../../../infrastructure/instance-template-repository/database-instance-template-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { Errors } from '../../../domain/dtos/errors';
import { UpdateInstanceTemplate } from '../../../application/use-cases/instance-template/update-instance-template';

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
const updateInstanceTemplate = new UpdateInstanceTemplate(logger, auth, instanceTemplateRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const bodyValidation = z
            .object({
                name: z.string().optional(),
                description: z.string().optional(),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!bodyValidation.success) throw Errors.validationError(bodyValidation.error);
        const { data: body } = bodyValidation;

        const instanceTemplateId = event.pathParameters?.instanceTemplateId;

        const output = await updateInstanceTemplate.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceTemplateId: instanceTemplateId ?? '',
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
