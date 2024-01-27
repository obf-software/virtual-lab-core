import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { UserDatabaseRepository } from '../../../infrastructure/user-database-repository';
import { GetUser } from '../../../application/use-cases/user/get-user';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';

const { DATABASE_URL } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const getUser = new GetUser(logger, auth, userRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const userIdString = event.pathParameters?.userId;
    const userId = Number(userIdString);

    if (userIdString !== 'me' && Number.isNaN(userId)) {
        throw new createHttpError.BadRequest('Invalid userId');
    }

    const output = await getUser.execute({
        principal: CognitoAuth.extractPrincipal(event),
        userId: userIdString === 'me' ? undefined : userId,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
