import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../../integrations/powertools';
import { AuthService } from '../../auth/service';
import { AwsServiceCatalogIntegration } from '../../../integrations/aws-service-catalog/service';
import { ProductService } from '../service';
import { GroupService } from '../../group/service';
import { GroupRepository } from '../../group/repository';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { InvalidPathParamsError } from '../../core/errors';

// Config
const { AWS_REGION, DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Integration
const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration({ AWS_REGION });

// Repository
const groupRepository = new GroupRepository(dbClient);

// Service
const groupService = new GroupService({ awsServiceCatalogIntegration, groupRepository });
const productService = new ProductService({ awsServiceCatalogIntegration, groupService });
const authService = new AuthService();

export const handler = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const { role, userId } = authService.getUserPoolJwtClaims(event);
    authService.throwIfInsufficientRole('USER', role);

    const userIdPathParam = event.pathParameters?.userId;
    const userIdPathParamNumber = Number(userIdPathParam);
    let userIdToUse = userId;

    if (authService.hasUserRoleOrAbove('ADMIN', role) && userIdPathParam !== 'me') {
        if (Number.isNaN(userIdPathParamNumber)) {
            throw InvalidPathParamsError('userId must be a number');
        }

        userIdToUse = userIdPathParamNumber;
    }

    const response = await productService.listUserProducts(userIdToUse);

    return {
        statusCode: 200,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' },
    };
}, true);
