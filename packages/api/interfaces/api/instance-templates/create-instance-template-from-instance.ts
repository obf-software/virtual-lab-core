import { z } from 'zod';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseInstanceTemplateRepository } from '../../../infrastructure/instance-template-repository/database-instance-template-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { Errors } from '../../../domain/dtos/errors';
import { CreateInstanceTemplateFromInstance } from '../../../application/use-cases/instance-template/create-instance-template-from-instance';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';

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
const createInstanceTemplateFromInstance = new CreateInstanceTemplateFromInstance(
    logger,
    auth,
    instanceRepository,
    instanceTemplateRepository,
    virtualizationGateway,
);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const bodyValidation = z
            .object({
                name: z.string(),
                description: z.string(),
                storageInGb: z.number().optional(),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!bodyValidation.success) throw Errors.validationError(bodyValidation.error);
        const { data: body } = bodyValidation;

        const output = await createInstanceTemplateFromInstance.execute({
            principal: CognitoAuth.extractPrincipal(event),
            instanceId: event.pathParameters?.instanceId ?? '',
            name: body.name,
            description: body.description,
            storageInGb: body.storageInGb,
        });

        return {
            statusCode: 201,
            body: JSON.stringify(output),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    },
    { logger },
);
