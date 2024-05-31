import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { z } from 'zod';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseInstanceRepository } from '../../../infrastructure/instance-repository/database-instance-repository';
import { ListInstances } from '../../../application/use-cases/instance/list-instances';
import { AwsVirtualizationGateway } from '../../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';

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
const virtualizationGateway = new AwsVirtualizationGateway({
    logger,
    configVault,
    AWS_REGION,
    SNS_TOPIC_ARN,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
    EVENT_BUS_ARN,
    EVENT_BUS_PUBLISHER_ROLE_ARN,
});
const listUserInstances = new ListInstances(
    logger,
    auth,
    instanceRepository,
    virtualizationGateway,
);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const { query } = LambdaHandlerAdapter.parseAPIRequest({
            event,
            querySchema: z
                .object({
                    orderBy: z
                        .enum(['creationDate', 'lastConnectionDate', 'alphabetical'])
                        .default('creationDate'),
                    order: z.enum(['asc', 'desc']).default('asc'),
                    ownerId: z.string().optional(),
                    textSearch: z.string().optional(),
                })
                .extend(seekPaginationInputSchema.shape),
        });

        const output = await listUserInstances.execute({
            principal: CognitoAuth.extractPrincipal(event),
            orderBy: query.orderBy,
            order: query.order,
            pagination: {
                resultsPerPage: query.resultsPerPage,
                page: query.page,
            },
            ownerId: query.ownerId,
            textSearch: query.textSearch,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
