import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import { InvalidQueryParamsError } from '../../core/errors';
import { Logger } from '@aws-lambda-powertools/logger';
import { UserRepository, schema } from '../../../infrastructure/repositories';
import { ListUsersUseCase } from '../use-cases/list-users';
import { handlerAdapter } from '../../../infrastructure/powertools/handler-adapter';
import { getRequestPrincipal } from '../../../infrastructure/auth/get-user-principal';

const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const listUsersUseCase = new ListUsersUseCase(new UserRepository(dbClient));

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const query = z
            .object({
                resultsPerPage: z.number({ coerce: true }).min(1).max(60).default(10),
                page: z.number({ coerce: true }).min(1).default(1),
            })
            .safeParse({ ...event.queryStringParameters });

        if (!query.success) {
            throw InvalidQueryParamsError(query.error.message);
        }

        const paginatedUsers = await listUsersUseCase.execute({
            principal: getRequestPrincipal(event),
            pagination: {
                resultsPerPage: query.data.resultsPerPage,
                page: query.data.page,
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify(paginatedUsers),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
