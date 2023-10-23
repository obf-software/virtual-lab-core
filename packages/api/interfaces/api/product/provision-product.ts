import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { InstanceRepository, QuotaRepository, schema } from '../../../infrastructure/repositories';
import { ProvisionProductUseCase } from '../provision-product';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';
import { z } from 'zod';
import { InvalidBodyError } from '../../core/errors';

const { AWS_REGION, DATABASE_URL, SERVICE_CATALOG_NOTIFICATION_ARN } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const provisionProductUseCase = new ProvisionProductUseCase(
    new QuotaRepository(dbClient),
    new InstanceRepository(dbClient),
    new ServiceCatalog(AWS_REGION),
);

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const body = z
            .object({
                userId: z.string().optional(),
                productId: z.string(),
                launchPathId: z.string(),
                provisionParameters: z.array(
                    z.object({
                        key: z.string(),
                        value: z.string(),
                    }),
                ),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));

        if (!body.success) {
            throw InvalidBodyError(body.error.message);
        }

        const instance = await provisionProductUseCase.execute({
            principal: getRequestPrincipal(event),
            userId: body.data.userId,
            launchPathId: body.data.launchPathId,
            provisionParameters: body.data.provisionParameters,
            productId: body.data.productId,
            notificationArn: SERVICE_CATALOG_NOTIFICATION_ARN,
        });

        return {
            statusCode: 201,
            body: JSON.stringify(instance),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    {
        isHttp: true,
        logger,
    },
);
