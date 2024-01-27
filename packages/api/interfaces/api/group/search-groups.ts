import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { SearchGroups } from '../../../application/use-cases/group/search-groups';
import { GroupDatabaseRepository } from '../../../infrastructure/group-database-repository';

const { DATABASE_URL } = process.env;

const logger = new Logger();
const auth = new CognitoAuth();
const groupRepository = new GroupDatabaseRepository(DATABASE_URL);
const searchGroups = new SearchGroups(logger, auth, groupRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const query = z
        .object({
            textQuery: z.string().min(1),
        })
        .safeParse({ ...event.queryStringParameters });
    if (!query.success) throw new createHttpError.BadRequest(query.error.message);

    const output = await searchGroups.execute({
        principal: CognitoAuth.extractPrincipal(event),
        textQuery: query.data.textQuery,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
