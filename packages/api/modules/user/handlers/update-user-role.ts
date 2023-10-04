import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import { InvalidBodyError } from '../../core/errors';
import { handlerAdapter } from '../../../infrastructure/powertools/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { UpdateUserRoleUseCase } from '../use-cases/update-user-role';
import { UserRepository, schema } from '../../../infrastructure/repositories';
import { getRequestPrincipal } from '../../../infrastructure/auth/get-user-principal';

const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const updateUserRoleUseCase = new UpdateUserRoleUseCase(new UserRepository(dbClient));

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const body = z
            .object({ role: z.enum(schema.userRole.enumValues) })
            .safeParse(JSON.parse(event.body ?? '{}'));

        if (!body.success) {
            throw InvalidBodyError(body.error.message);
        }

        const user = await updateUserRoleUseCase.execute({
            principal: getRequestPrincipal(event),
            userId: event.pathParameters?.userId,
            role: body.data.role,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(user),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
