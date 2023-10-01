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
import { AwsCloudformationIntegration } from '../../../integrations/aws-cloudformation/service';
import { AwsEc2Integration } from '../../../integrations/aws-ec2/service';
import { GuacamoleIntegration } from '../../../integrations/guacamole/service';
import { InstanceRepository } from '../../instance/repository';
import { InstanceService } from '../../instance/service';

// Config
const { AWS_REGION, DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Integration
const awsEc2Integration = new AwsEc2Integration({ AWS_REGION });
const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration({ AWS_REGION });
const awsCloudformationIntegration = new AwsCloudformationIntegration({ AWS_REGION });
const guacamoleIntegration = new GuacamoleIntegration();

// Repository
const groupRepository = new GroupRepository(dbClient);
const instanceRepository = new InstanceRepository(dbClient);

// Service
const groupService = new GroupService({ awsServiceCatalogIntegration, groupRepository });
const instanceService = new InstanceService({
    awsEc2Integration,
    awsServiceCatalogIntegration,
    GUACAMOLE_CYPHER_KEY,
    guacamoleIntegration,
    INSTANCE_PASSWORD,
    instanceRepository,
});
const productService = new ProductService({
    awsServiceCatalogIntegration,
    awsEc2Integration,
    awsCloudformationIntegration,
    groupService,
    instanceService,
});
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
