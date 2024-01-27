import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { GroupDatabaseRepository } from '../../../infrastructure/group-database-repository';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { UnlinkUsersFromGroup } from '../../../application/use-cases/group/unlink-users-from-group';

const { DATABASE_URL } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const groupRepository = new GroupDatabaseRepository(DATABASE_URL);
const unlinkUsersfromGroup = new UnlinkUsersFromGroup(logger, auth, groupRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const body = z
        .object({ userIds: z.array(z.number().int().positive().max(50)) })
        .safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) throw new createHttpError.BadRequest('Invalid body');

    const groupIdString = event.pathParameters?.groupId;
    const groupId = Number(groupIdString);

    if (Number.isNaN(groupId)) {
        throw new createHttpError.BadRequest('Invalid groupId');
    }

    await unlinkUsersfromGroup.execute({
        principal: CognitoAuth.extractPrincipal(event),
        groupId,
        userIds: body.data.userIds,
    });

    return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
    };
});
