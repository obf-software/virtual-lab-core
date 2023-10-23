import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { GroupDatabaseRepository } from '../../../infrastructure/repositories/group-database-repository';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';
import { DeleteGroup } from '../../../application/use-cases/group/delete-group';

const { DATABASE_URL } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const groupRepository = new GroupDatabaseRepository(DATABASE_URL);
const deleteGroup = new DeleteGroup(logger, auth, groupRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const groupIdString = event.pathParameters?.groupId;
    const groupId = Number(groupIdString);

    if (Number.isNaN(groupId)) {
        throw new createHttpError.BadRequest('Invalid groupId');
    }

    await deleteGroup.execute({
        principal: CognitoAuth.extractPrincipal(event),
        groupId,
    });

    return {
        statusCode: 200,
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
    };
});
