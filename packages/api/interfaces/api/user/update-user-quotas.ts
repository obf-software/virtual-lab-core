import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { z } from 'zod';
import { UpdateUserQuotas } from '../../../application/use-cases/user/update-user-quotas';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseUserRepository } from '../../../infrastructure/user-repository/database-user-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { Errors } from '../../../domain/dtos/errors';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';

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
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const virtualizationGateway = new AwsVirtualizationGateway(
    configVault,
    AWS_REGION,
    API_SNS_TOPIC_ARN,
    SERVICE_CATALOG_PORTFOLIO_ID_PARAMETER_NAME,
);
const updateUserQuotas = new UpdateUserQuotas(logger, auth, userRepository, virtualizationGateway);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const body = z
            .object({
                maxInstances: z.number().optional(),
                allowedInstanceTypes: z.array(z.string()).optional(),
                canLaunchInstanceWithHibernation: z.boolean().optional(),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!body.success) throw Errors.validationError(body.error);

        const userId = event.pathParameters?.userId;

        const output = await updateUserQuotas.execute({
            principal: CognitoAuth.extractPrincipal(event),
            userId: userId === 'me' ? undefined : userId,
            maxInstances: body.data.maxInstances,
            allowedInstanceTypes: body.data.allowedInstanceTypes,
            canLaunchInstanceWithHibernation: body.data.canLaunchInstanceWithHibernation,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
