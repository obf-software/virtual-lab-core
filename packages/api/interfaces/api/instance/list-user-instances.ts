import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { InstanceDatabaseRepository } from '../../../infrastructure/instance-database-repository';
import { ListUserInstances } from '../../../application/use-cases/instance/list-user-instances';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AwsVirtualizationGateway } from '../../../infrastructure/aws-virtualization-gateway';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { z } from 'zod';
import createHttpError from 'http-errors';

const { AWS_REGION, DATABASE_URL } = process.env;

const logger = new Logger();
const auth = new CognitoAuth();
const virtualizationGateway = new AwsVirtualizationGateway(AWS_REGION);
const instanceRepository = new InstanceDatabaseRepository(DATABASE_URL);
const listUserInstances = new ListUserInstances(
    logger,
    auth,
    instanceRepository,
    virtualizationGateway,
);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const query = z
        .object({
            resultsPerPage: z.number({ coerce: true }).min(1).max(60).default(10),
            page: z.number({ coerce: true }).min(1).default(1),
        })
        .safeParse({ ...event.queryStringParameters });
    if (!query.success) throw createHttpError.BadRequest(query.error.message);

    const userIdString = event.pathParameters?.userId;
    const userId = Number(userIdString);

    if (userIdString !== 'me' && Number.isNaN(userId)) {
        throw new createHttpError.BadRequest('Invalid userId');
    }

    const output = await listUserInstances.execute({
        principal: CognitoAuth.extractPrincipal(event),
        userId: userIdString === 'me' ? undefined : userId,
        pagination: {
            resultsPerPage: query.data.resultsPerPage,
            page: query.data.page,
        },
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
