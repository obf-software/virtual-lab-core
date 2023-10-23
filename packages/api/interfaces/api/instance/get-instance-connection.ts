import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { GetInstanceConnection } from '../../../application/use-cases/instance/get-instance-connection';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { InstanceDatabaseRepository } from '../../../infrastructure/repositories/instance-database-repository';
import { GuacamoleConnectionEncoder } from '../../../infrastructure/guacamole-connection-encoder';
import { AwsVirtualizationGateway } from '../../../infrastructure/aws-virtualization-gateway';
import createHttpError from 'http-errors';

const { AWS_REGION, DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD } = process.env;

const logger = new Logger();
const auth = new CognitoAuth();
const instanceRepository = new InstanceDatabaseRepository(DATABASE_URL);
const connectionEncoder = new GuacamoleConnectionEncoder(GUACAMOLE_CYPHER_KEY);
const virtualizationGateway = new AwsVirtualizationGateway(AWS_REGION);
const getInstanceConnection = new GetInstanceConnection(
    logger,
    auth,
    instanceRepository,
    connectionEncoder,
    virtualizationGateway,
    INSTANCE_PASSWORD,
);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const instanceIdString = event.pathParameters?.instanceId;
    const instanceId = Number(instanceIdString);

    if (Number.isNaN(instanceId)) {
        throw new createHttpError.BadRequest('Invalid instanceId');
    }

    const output = await getInstanceConnection.execute({
        principal: CognitoAuth.extractPrincipal(event),
        instanceId,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
