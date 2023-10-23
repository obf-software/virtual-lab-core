import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from '@aws-lambda-powertools/logger';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { DeleteInstanceUseCase } from '../delete-instance';
import { InstanceRepository, schema } from '../../../infrastructure/repositories';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';

const { AWS_REGION, DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const deleteInstanceUseCase = new DeleteInstanceUseCase(
    logger,
    new InstanceRepository(dbClient),
    new ServiceCatalog(AWS_REGION),
);

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const deleteInstanceId = await deleteInstanceUseCase.execute({
            principal: getRequestPrincipal(event),
            instanceId: Number(event.pathParameters?.instanceId),
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ deleteInstanceId }),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
