import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
import { createHandler } from '../../integrations/powertools';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { z } from 'zod';
import { InstanceRepository } from './repository';
import { InstanceService } from './service';
import { AuthService } from '../auth/service';
import { InvalidQueryParamsError } from '../core/errors';
import { AwsEc2Integration } from '../../integrations/aws-ec2/service';

const { DATABASE_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const awsEc2Integration = new AwsEc2Integration();
const instanceRepository = new InstanceRepository(dbClient);
const instanceService = new InstanceService(instanceRepository, awsEc2Integration);
const authService = new AuthService();

export const listUserInstances = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const { role, userId } = authService.getUserPoolJwtClaims(event);
        authService.throwIfInsufficientRole('USER', role);

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
