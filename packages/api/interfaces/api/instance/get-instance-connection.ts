import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Logger } from '@aws-lambda-powertools/logger';
import { InstanceRepository, schema } from '../../../infrastructure/repositories';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { GetInstanceConnectionUseCase } from '../get-instance-connection';
import { Guacamole } from '../../../infrastructure/connection-encoder/old/guacamole/guacamole';
import { EC2 } from '../../../infrastructure/aws/ec2';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';

const { AWS_REGION, DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const getInstanceConnectionUseCase = new GetInstanceConnectionUseCase(
    INSTANCE_PASSWORD,
    new InstanceRepository(dbClient),
    new Guacamole(GUACAMOLE_CYPHER_KEY),
    new EC2(AWS_REGION),
);

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const connection = await getInstanceConnectionUseCase.execute({
            principal: getRequestPrincipal(event),
            instanceId: Number(event.pathParameters?.instanceId),
        });

        return {
            statusCode: 200,
            body: JSON.stringify(connection),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
