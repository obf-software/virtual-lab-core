import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../integrations/powertools';
import { UserRepository } from './repository';
import { UserService } from './service';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
import { z } from 'zod';
import { UserRole } from './protocols';
import { AuthService } from '../auth/service';
import { InvalidBodyError, InvalidPathParamsError, InvalidQueryParamsError } from '../core/errors';

const { DATABASE_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const userRepository = new UserRepository(dbClient);
const userService = new UserService(userRepository);
const authService = new AuthService();

export const listUsers = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
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

    const result = await userService.listUsers({ resultsPerPage, page });

    return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json' },
    };
}, true);

export const updateUserRole = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const { role } = authService.getUserPoolJwtClaims(event);
        authService.throwIfInsufficientRole('ADMIN', role);

        const userIdPathParam = event.pathParameters?.userId;
        const userIdPathParamNumber = Number(userIdPathParam);

        if (Number.isNaN(userIdPathParamNumber)) {
            throw InvalidPathParamsError('userId must be a number');
        }

        const body = z
            .object({ role: z.nativeEnum(UserRole) })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!body.success) throw InvalidBodyError(body.error.message);

        await userService.updateRole(userIdPathParamNumber, body.data.role);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User role updated successfully' }),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    true,
);
