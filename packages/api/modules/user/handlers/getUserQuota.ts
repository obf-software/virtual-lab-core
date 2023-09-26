import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../../integrations/powertools';
import { UserRepository } from '../repository';
import { UserService } from '../service';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { AuthService } from '../../auth/service';
import { InvalidPathParamsError } from '../../core/errors';

// Config
const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Repository
const userRepository = new UserRepository(dbClient);

// Service
const userService = new UserService({ userRepository });
const authService = new AuthService();

export const handler = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
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

    const quota = await userService.getUserQuota(userIdToUse);

    return {
        statusCode: 200,
        body: JSON.stringify(quota),
        headers: { 'Content-Type': 'application/json' },
    };
}, true);
