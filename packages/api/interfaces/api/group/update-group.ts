import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { GroupDatabaseRepository } from '../../../infrastructure/repositories/group-database-repository';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';
import { UpdateGroup } from '../../../application/use-cases/group/update-group';
import { z } from 'zod';

const { DATABASE_URL } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const groupRepository = new GroupDatabaseRepository(DATABASE_URL);
const updateGroup = new UpdateGroup(logger, auth, groupRepository);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const body = z
        .object({
            name: z.string().max(128).nonempty().optional(),
            description: z.string().nonempty().optional(),
        })
        .safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) throw new createHttpError.BadRequest('Invalid body');

    const groupIdString = event.pathParameters?.groupId;
    const groupId = Number(groupIdString);

    if (Number.isNaN(groupId)) {
        throw new createHttpError.BadRequest('Invalid groupId');
    }

    const output = await updateGroup.execute({
        principal: CognitoAuth.extractPrincipal(event),
        groupId,
        name: body.data.name,
        description: body.data.description,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
