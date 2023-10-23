import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { ProvisionProduct } from '../../../application/use-cases/product/provision-product';
import { Logger } from '@aws-lambda-powertools/logger';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { UserDatabaseRepository } from '../../../infrastructure/repositories/user-database-repository';
import { InstanceDatabaseRepository } from '../../../infrastructure/repositories/instance-database-repository';
import { AwsCatalogGateway } from '../../../infrastructure/aws-catalog-gateway';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { z } from 'zod';
import createHttpError from 'http-errors';

const { AWS_REGION, DATABASE_URL, SERVICE_CATALOG_NOTIFICATION_ARN } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const userRepository = new UserDatabaseRepository(DATABASE_URL);
const instanceRepository = new InstanceDatabaseRepository(DATABASE_URL);
const catalogGateway = new AwsCatalogGateway(AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN);
const provisionProduct = new ProvisionProduct(
    logger,
    auth,
    userRepository,
    instanceRepository,
    catalogGateway,
);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const body = z
        .object({
            userId: z.string().or(z.number()).default('me'),
            parameters: z.record(z.string()),
        })
        .safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) throw new createHttpError.BadRequest('Invalid body');

    const userIdString = body.data.userId;
    const userId = Number(userIdString);

    if (userIdString !== 'me' && Number.isNaN(userId)) {
        throw new createHttpError.BadRequest('Invalid userId');
    }

    const productIdString = event.pathParameters?.productId;

    if (!productIdString) {
        throw new createHttpError.BadRequest('Invalid productId');
    }

    const output = await provisionProduct.execute({
        principal: CognitoAuth.extractPrincipal(event),
        userId: userIdString === 'me' ? undefined : userId,
        productId: productIdString,
        parameters: body.data.parameters,
    });

    return {
        statusCode: 201,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
