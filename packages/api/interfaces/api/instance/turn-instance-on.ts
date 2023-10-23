import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { InstanceDatabaseRepository } from '../../../infrastructure/repositories/instance-database-repository';
import { AwsVirtualizationGateway } from '../../../infrastructure/aws-virtualization-gateway';
import createHttpError from 'http-errors';
import { TurnInstanceOn } from '../../../application/use-cases/instance/turn-instance-on';

const { AWS_REGION, DATABASE_URL } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const instanceRepository = new InstanceDatabaseRepository(DATABASE_URL);
const virtualizationGateway = new AwsVirtualizationGateway(AWS_REGION);
const turnInstanceOn = new TurnInstanceOn(logger, auth, instanceRepository, virtualizationGateway);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const instanceIdString = event.pathParameters?.instanceId;
    const instanceId = Number(instanceIdString);
    if (Number.isNaN(instanceId)) throw new createHttpError.BadRequest('Invalid instanceId');

    await turnInstanceOn.execute({
        principal: CognitoAuth.extractPrincipal(event),
        instanceId,
    });

    return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
    };
});
