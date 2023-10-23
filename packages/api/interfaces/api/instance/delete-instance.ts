import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { DeleteInstance } from '../../../application/use-cases/instance/delete-instance';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { InstanceDatabaseRepository } from '../../../infrastructure/repositories/instance-database-repository';
import { AwsCatalogGateway } from '../../../infrastructure/aws-catalog-gateway';
import createHttpError from 'http-errors';

const { AWS_REGION, DATABASE_URL, SERVICE_CATALOG_NOTIFICATION_ARN } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const instanceRepository = new InstanceDatabaseRepository(DATABASE_URL);
const catalogGateway = new AwsCatalogGateway(AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN);
const deleteInstance = new DeleteInstance(logger, auth, instanceRepository, catalogGateway);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const instanceIdString = event.pathParameters?.instanceId;
    const instanceId = Number(instanceIdString);

    if (Number.isNaN(instanceId)) {
        throw new createHttpError.BadRequest('Invalid instanceId');
    }

    await deleteInstance.execute({
        principal: CognitoAuth.extractPrincipal(event),
        instanceId,
    });

    return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
    };
});
