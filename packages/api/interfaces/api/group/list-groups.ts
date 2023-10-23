import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { z } from 'zod';
import { InvalidQueryParamsError } from '../../core/errors';
import { Logger } from '@aws-lambda-powertools/logger';
import { ListGroupsUseCase } from '../list-groups';
import { GroupRepository, schema } from '../../../infrastructure/repositories';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';

const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const listGroupsUseCase = new ListGroupsUseCase({
    groupRepository: new GroupRepository(dbClient),
});

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

        const paginatedGroups = await listGroupsUseCase.execute({
            principal: getRequestPrincipal(event),
            pagination: {
                resultsPerPage: query.data.resultsPerPage,
                page: query.data.page,
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify(paginatedGroups),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
