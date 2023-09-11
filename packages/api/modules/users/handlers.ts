import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../integrations/powertools';
import { getUserPoolJwtClaims, hasUserRoleOrAbove } from '../auth/authorization';
import { InsufficientRoleError, InvalidQueryParamsError } from '../../protocols/errors';
import { UserRepository } from './user-repository';
import { UserService } from './user-service';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
import { z } from 'zod';

const { DATABASE_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const userRepository = new UserRepository(dbClient);
const userService = new UserService(userRepository);

export const listUsers = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const { role } = getUserPoolJwtClaims(event);
    if (!hasUserRoleOrAbove('ADMIN', role)) throw InsufficientRoleError(role, 'ADMIN');

    const query = z
        .object({
            resultsPerPage: z.string().default('10').transform(Number),
            page: z.string().default('1').transform(Number),
        })
        .safeParse({ ...event.queryStringParameters });
    if (!query.success) throw InvalidQueryParamsError(query.error.message);

    const { resultsPerPage, page } = query.data;
    const result = await userService.list({ resultsPerPage, page });

    return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json' },
    };
}, true);

export const listUserGroups = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const { role, userId } = getUserPoolJwtClaims(event);
        if (!hasUserRoleOrAbove('USER', role)) throw InsufficientRoleError(role, 'USER');

        const userIdPathParam = event.pathParameters?.userId;
        const userIdPathParamNumber = Number(userIdPathParam);
        let userIdToUse = userId;

        if (
            hasUserRoleOrAbove('ADMIN', role) &&
            userIdPathParam !== 'me' &&
            !Number.isNaN(userIdPathParamNumber)
        ) {
            userIdToUse = userIdPathParamNumber;
        }

        const query = z
            .object({
                resultsPerPage: z.string().default('10').transform(Number),
                page: z.string().default('1').transform(Number),
            })
            .safeParse({ ...event.queryStringParameters });
        if (!query.success) throw InvalidQueryParamsError(query.error.message);

        const { resultsPerPage, page } = query.data;
        const result = await userService.listGroups(userIdToUse, { resultsPerPage, page });

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    true,
);
