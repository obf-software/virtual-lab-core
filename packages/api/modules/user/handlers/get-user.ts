import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { QuotaRepository, UserRepository, schema } from '../../../infrastructure/repositories';
import { Logger } from '@aws-lambda-powertools/logger';
import { GetUserUseCase } from '../use-cases/get-user';
import { handlerAdapter } from '../../../infrastructure/powertools/handler-adapter';
import { getRequestPrincipal } from '../../../infrastructure/auth/get-user-principal';

const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const getUserUseCase = new GetUserUseCase(
    new UserRepository(dbClient),
    new QuotaRepository(dbClient),
);

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const user = await getUserUseCase.execute({
            principal: getRequestPrincipal(event),
            userId: event.pathParameters?.userId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(user),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
