import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { GetProductProvisioningParameters } from '../../../application/use-cases/product/get-product-provisioning-parameters';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AwsCatalogGateway } from '../../../infrastructure/catalog-gateway/aws-catalog-gateway';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import createHttpError from 'http-errors';

const { AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const catalogGateway = new AwsCatalogGateway(AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN);
const getProductProvisioningParameters = new GetProductProvisioningParameters(
    logger,
    auth,
    catalogGateway,
);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const productIdString = event.pathParameters?.productId;

    if (!productIdString) {
        throw new createHttpError.BadRequest('Invalid productId');
    }

    const output = await getProductProvisioningParameters.execute({
        principal: CognitoAuth.extractPrincipal(event),
        productId: productIdString,
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
