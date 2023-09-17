import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
import { createHandler } from '../../integrations/powertools';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { getUserPoolJwtClaims, hasUserRoleOrAbove } from '../auth/authorization';
import { InsufficientRoleError, InvalidQueryParamsError } from '../../protocols/errors';
import { z } from 'zod';
import { InstanceRepository } from './repository';
import { InstanceService } from './service';

const { DATABASE_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const instanceRepository = new InstanceRepository(dbClient);
const instanceService = new InstanceService(instanceRepository);

export const listUserInstances = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const { role, userId } = getUserPoolJwtClaims(event);
        if (!hasUserRoleOrAbove('USER', role)) throw InsufficientRoleError(role, 'USER');

        const query = z
            .object({
                resultsPerPage: z.string().default('10').transform(Number),
                page: z.string().default('1').transform(Number),
            })
            .safeParse({ ...event.queryStringParameters });
        if (!query.success) throw InvalidQueryParamsError(query.error.message);

        const { resultsPerPage, page } = query.data;
        const result = await instanceService.listUserInstances(userId, { resultsPerPage, page });

        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    true,
);
