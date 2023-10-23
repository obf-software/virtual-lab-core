import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { UserDatabaseRepository } from '../../../infrastructure/repositories/user-database-repository';
import { ListUsers } from '../../../application/use-cases/user/list-users';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { seekPaginationInput } from '../../../domain/dtos/seek-pagination-input';
import createHttpError from 'http-errors';

const { DATABASE_URL } = process.env;

const logger = new Logger();
const auth = new CognitoAuth();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const listUsers = new ListUsers(logger, auth, userRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const query = seekPaginationInput.safeParse({ ...event.queryStringParameters });
    if (!query.success) {
        throw new createHttpError.BadRequest('Invalid query parameters');
    }

    const output = await listUsers.execute({
        principal: CognitoAuth.extractPrincipal(event),
        pagination: {
            page: query.data.page,
            resultsPerPage: query.data.resultsPerPage,
        },
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
