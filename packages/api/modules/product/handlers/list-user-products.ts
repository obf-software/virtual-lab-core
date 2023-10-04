import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from '@aws-lambda-powertools/logger';
import { GroupRepository, schema } from '../../../infrastructure/repositories';
import { ListUserProductsUseCase } from '../use-cases/list-user-products';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { handlerAdapter } from '../../../infrastructure/powertools/handler-adapter';
import { getRequestPrincipal } from '../../../infrastructure/auth/get-user-principal';

const { AWS_REGION, DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const listUserProductsUseCase = new ListUserProductsUseCase(
    new GroupRepository(dbClient),
    new ServiceCatalog(AWS_REGION),
);

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const userProducts = await listUserProductsUseCase.execute({
            principal: getRequestPrincipal(event),
            userId: event.pathParameters?.userId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(userProducts),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
