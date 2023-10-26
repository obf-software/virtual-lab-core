import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { UserDatabaseRepository } from '../../../infrastructure/repositories/user-database-repository';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';
import { ListGroupUsers } from '../../../application/use-cases/user/list-group-users';
import { z } from 'zod';

const { DATABASE_URL } = process.env;

const logger = new Logger();
const auth = new CognitoAuth();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const listGroupUsers = new ListGroupUsers(logger, auth, userRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const query = z
        .object({
            resultsPerPage: z.number({ coerce: true }).min(1).max(60).default(10),
            page: z.number({ coerce: true }).min(1).default(1),
        })
        .safeParse({ ...event.queryStringParameters });
    if (!query.success) throw new createHttpError.BadRequest(query.error.message);

    const groupIdString = event.pathParameters?.groupId;
    const groupId = Number(groupIdString);

    if (Number.isNaN(groupId)) {
        throw new createHttpError.BadRequest(`Invalid groupId: ${groupIdString}`);
    }

    const output = await listGroupUsers.execute({
        principal: CognitoAuth.extractPrincipal(event),
        pagination: {
            page: query.data.page,
            resultsPerPage: query.data.resultsPerPage,
        },
        groupId,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
