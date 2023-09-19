import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
import { GroupRepository } from './repository';
import { GroupService } from './service';
import { createHandler } from '../../integrations/powertools';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { z } from 'zod';
import { AuthService } from '../auth/service';
import { InvalidPathParamsError, InvalidQueryParamsError } from '../core/errors';

const { DATABASE_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const groupRepository = new GroupRepository(dbClient);
const groupService = new GroupService(groupRepository);
const authService = new AuthService();

export const listGroups = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const { role } = authService.getUserPoolJwtClaims(event);
        authService.throwIfInsufficientRole('ADMIN', role);

        const query = z
            .object({
                resultsPerPage: z.string().default('10').transform(Number),
                page: z.string().default('1').transform(Number),
            })
            .safeParse({ ...event.queryStringParameters });
        if (!query.success) throw InvalidQueryParamsError(query.error.message);
        const { resultsPerPage, page } = query.data;

        const result = await groupService.listGroups({ resultsPerPage, page });

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    true,
);

export const listUserGroups = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const { role, userId } = authService.getUserPoolJwtClaims(event);
        authService.throwIfInsufficientRole('USER', role);

        const userIdPathParam = event.pathParameters?.userId;
        const userIdPathParamNumber = Number(userIdPathParam);
        let userIdToUse = userId;

        if (authService.hasUserRoleOrAbove('ADMIN', role) && userIdPathParam !== 'me') {
            if (Number.isNaN(userIdPathParamNumber)) {
                throw InvalidPathParamsError('userId must be a number');
            }

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

        const result = await groupService.listUserGroups(userIdToUse, { resultsPerPage, page });

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    true,
);
