import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { z } from 'zod';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { LaunchInstance } from '../../../application/use-cases/instance/launch-instance';
import { DatabaseUserRepository } from '../../../infrastructure/user-repository/database-user-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { Errors } from '../../../domain/dtos/errors';
import { DatabaseInstanceTemplateRepository } from '../../../infrastructure/instance-template-repository/database-instance-template-repository';

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
} = process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault({ AWS_REGION })
        : new LambdaLayerConfigVault({ AWS_SESSION_TOKEN });
const userRepository = new DatabaseUserRepository({ configVault, DATABASE_URL_PARAMETER_NAME });
const instanceRepository = new DatabaseInstanceRepository({
    configVault,
    DATABASE_URL_PARAMETER_NAME,
});
const instanceTemplateRepository = new DatabaseInstanceTemplateRepository({
    configVault,
    DATABASE_URL_PARAMETER_NAME,
});
const virtualizationGateway = new AwsVirtualizationGateway({
    configVault,
    AWS_REGION,
    SNS_TOPIC_ARN,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
    EVENT_BUS_ARN,
    EVENT_BUS_PUBLISHER_ROLE_ARN,
});
const launchInstance = new LaunchInstance(
    logger,
    auth,
    userRepository,
    instanceRepository,
    instanceTemplateRepository,
    virtualizationGateway,
);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const body = z
            .object({
                ownerId: z.string().optional(),
                name: z.string(),
                description: z.string(),
                templateId: z.string(),
                instanceType: z.string(),
                canHibernate: z.boolean(),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!body.success) throw Errors.validationError(body.error);

        const output = await launchInstance.execute({
            principal: CognitoAuth.extractPrincipal(event),
            ownerId: body.data.ownerId === 'me' ? undefined : body.data.ownerId,
            templateId: body.data.templateId,
            name: body.data.name,
            description: body.data.description,
            instanceType: body.data.instanceType,
            canHibernate: body.data.canHibernate,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
