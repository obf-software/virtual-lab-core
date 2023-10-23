import { Logger } from '@aws-lambda-powertools/logger';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { ListUserProducts } from '../../../application/use-cases/product/list-user-products';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { GroupDatabaseRepository } from '../../../infrastructure/repositories/group-database-repository';
import { AwsCatalogGateway } from '../../../infrastructure/aws-catalog-gateway';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';

const { AWS_REGION, DATABASE_URL, SERVICE_CATALOG_NOTIFICATION_ARN } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const groupRepository = new GroupDatabaseRepository(DATABASE_URL);
const catalogGateway = new AwsCatalogGateway(AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN);
const listUserProducts = new ListUserProducts(logger, auth, groupRepository, catalogGateway);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const userIdString = event.pathParameters?.userId;
    const userId = Number(userIdString);

    if (userIdString !== 'me' && Number.isNaN(userId)) {
        throw new createHttpError.BadRequest('Invalid userId');
    }

    const output = await listUserProducts.execute({
        principal: CognitoAuth.extractPrincipal(event),
        userId: userIdString === 'me' ? undefined : userId,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
