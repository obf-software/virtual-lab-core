import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { z } from 'zod';
import { InvalidBodyError } from '../../core/errors';
import { Logger } from '@aws-lambda-powertools/logger';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { InstanceRepository, schema } from '../../../infrastructure/repositories';
import { ChangeInstanceStateUseCase } from '../change-instance-state';
import { EC2 } from '../../../infrastructure/aws/ec2';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';

const { AWS_REGION, DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const changeInstanceStateUseCase = new ChangeInstanceStateUseCase(
    logger,
    new InstanceRepository(dbClient),
    new EC2(AWS_REGION),
);

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const body = z
            .object({
                state: z.enum(['start', 'stop', 'reboot']),
            })
            .safeParse(JSON.parse(event.body ?? ''));

        if (!body.success) {
            throw InvalidBodyError(body.error.message);
        }

        await changeInstanceStateUseCase.execute({
            principal: getRequestPrincipal(event),
            instanceId: Number(event.pathParameters?.instanceId),
            state: body.data.state,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Instance state changed' }),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
