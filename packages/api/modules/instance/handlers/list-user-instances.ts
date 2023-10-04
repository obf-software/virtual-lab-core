import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import { InvalidQueryParamsError } from '../../core/errors';
import { handlerAdapter } from '../../../infrastructure/powertools/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { ListUserInstancesUseCase } from '../use-cases/list-user-instances';
import { InstanceRepository, schema } from '../../../infrastructure/repositories';
import { getRequestPrincipal } from '../../../infrastructure/auth/get-user-principal';
import { EC2 } from '../../../infrastructure/aws/ec2';

const { AWS_REGION, DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();
const listUserInstancesUseCase = new ListUserInstancesUseCase(
    new InstanceRepository(dbClient),
    new EC2(AWS_REGION),
);

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

        const userInstances = await listUserInstancesUseCase.execute({
            principal: getRequestPrincipal(event),
            userId: event.pathParameters?.userId,
            pagination: {
                resultsPerPage: query.data.resultsPerPage,
                page: query.data.page,
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify(userInstances),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
