import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { UserDatabaseRepository } from '../../../infrastructure/repositories/user-database-repository';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { UpdateUserQuotas } from '../../../application/use-cases/user/update-user-quotas';

const { DATABASE_URL } = process.env;

const logger = new Logger();
const auth = new CognitoAuth();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const updateUserQuotas = new UpdateUserQuotas(logger, auth, userRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const userIdString = event.pathParameters?.userId;
    const userId = Number(userIdString);

    if (userIdString !== 'me' && Number.isNaN(userId)) {
        throw new createHttpError.BadRequest('Invalid userId');
    }

    const body = z
        .object({ maxInstances: z.number().int().positive() })
        .safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) {
        throw new createHttpError.BadRequest('Invalid body');
    }

    const output = await updateUserQuotas.execute({
        principal: CognitoAuth.extractPrincipal(event),
        userId: userIdString === 'me' ? undefined : userId,
        maxInstances: body.data.maxInstances,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
