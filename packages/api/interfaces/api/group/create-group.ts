import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { z } from 'zod';
import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { CreateGroup } from '../../../application/use-cases/group/create-group';
import { GroupDatabaseRepository } from '../../../infrastructure/repositories/group-database-repository';
import { AwsCatalogGateway } from '../../../infrastructure/aws-catalog-gateway';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';

const { AWS_REGION, DATABASE_URL, SERVICE_CATALOG_NOTIFICATION_ARN } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const groupRepository = new GroupDatabaseRepository(DATABASE_URL);
const catalogGateway = new AwsCatalogGateway(AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN);
const createGroupUseCase = new CreateGroup(logger, auth, groupRepository, catalogGateway);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const body = z
        .object({
            name: z.string().max(128).nonempty(),
            description: z.string().nonempty(),
            portfolioId: z.string().max(50).nonempty(),
        })
        .safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) throw new createHttpError.BadRequest('Invalid body');

    const output = await createGroupUseCase.execute({
        principal: CognitoAuth.extractPrincipal(event),
        name: body.data.name,
        description: body.data.description,
        portfolioId: body.data.portfolioId,
    });

    return {
        statusCode: 201,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
