import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { GroupDatabaseRepository } from '../../../infrastructure/repositories/group-database-repository';
import { ListGroups } from '../../../application/use-cases/group/list-groups';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { z } from 'zod';
import createHttpError from 'http-errors';

const { DATABASE_URL } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const groupRepository = new GroupDatabaseRepository(DATABASE_URL);
const listGroups = new ListGroups(logger, auth, groupRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const query = z
        .object({
            resultsPerPage: z.number({ coerce: true }).min(1).max(60).default(10),
            page: z.number({ coerce: true }).min(1).default(1),
        })
        .safeParse({ ...event.queryStringParameters });

    if (!query.success) {
        throw new createHttpError.BadRequest('Invalid query string parameters');
    }

    const output = await listGroups.execute({
        principal: CognitoAuth.extractPrincipal(event),
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
