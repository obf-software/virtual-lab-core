import { Logger } from '@aws-lambda-powertools/logger';
import { HandlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { ListPortfolios } from '../../../application/use-cases/product/list-portfolios';
import { CognitoAuth } from '../../../infrastructure/cognito-auth';
import { AwsCatalogGateway } from '../../../infrastructure/aws-catalog-gateway';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';

const { AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN } = process.env;
const logger = new Logger();
const auth = new CognitoAuth();
const catalogGateway = new AwsCatalogGateway(AWS_REGION, SERVICE_CATALOG_NOTIFICATION_ARN);
const listPortfolios = new ListPortfolios(logger, auth, catalogGateway);

export const handler = HandlerAdapter.create(
    logger,
).adaptHttp<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const output = await listPortfolios.execute({
        principal: CognitoAuth.extractPrincipal(event),
    });

    return {
        statusCode: 200,
        body: JSON.stringify(output),
        headers: { 'Content-Type': 'application/json' },
    };
});
