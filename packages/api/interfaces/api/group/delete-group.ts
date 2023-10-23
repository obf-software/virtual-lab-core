import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { GroupRepository, schema } from '../../../infrastructure/repositories';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { DeleteGroupUseCase } from '../delete-group';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';

const { DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const deleteGroupUseCase = new DeleteGroupUseCase({
    groupRepository: new GroupRepository(dbClient),
});

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const deletedGroup = await deleteGroupUseCase.execute({
            principal: getRequestPrincipal(event),
            groupId: Number(event.pathParameters?.groupId),
        });

        return {
            statusCode: 200,
            body: JSON.stringify(deletedGroup),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
