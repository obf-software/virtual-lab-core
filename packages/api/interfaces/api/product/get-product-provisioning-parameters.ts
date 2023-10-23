import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { Logger } from '@aws-lambda-powertools/logger';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { GetProductProvisioningParametersUseCase } from '../get-product-provisioning-parameters';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';

const { AWS_REGION } = process.env;
const logger = new Logger();

const getProductProvisioningParametersUseCase = new GetProductProvisioningParametersUseCase(
    new ServiceCatalog(AWS_REGION),
);

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const provisioningParameters = await getProductProvisioningParametersUseCase.execute({
            principal: getRequestPrincipal(event),
            awsProductId: event.pathParameters?.productId ?? '',
        });

        return {
            statusCode: 200,
            body: JSON.stringify(provisioningParameters),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
