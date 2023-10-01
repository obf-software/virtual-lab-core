import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../../integrations/powertools';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { AwsEc2Integration } from '../../../integrations/aws-ec2/service';
import { InstanceRepository } from '../repository';
import { InstanceService } from '../service';
import { AuthService } from '../../auth/service';
import { InvalidPathParamsError } from '../../core/errors';
import { GuacamoleIntegration } from '../../../integrations/guacamole/service';
import { AwsServiceCatalogIntegration } from '../../../integrations/aws-service-catalog/service';

// Config
const { AWS_REGION, DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Integration
const awsEc2Integration = new AwsEc2Integration({ AWS_REGION });
const guacamoleIntegration = new GuacamoleIntegration();
const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration({ AWS_REGION });

// Repository
const instanceRepository = new InstanceRepository(dbClient);

// Service
const instanceService = new InstanceService({
    INSTANCE_PASSWORD,
    GUACAMOLE_CYPHER_KEY,
    instanceRepository,
    awsEc2Integration,
    guacamoleIntegration,
    awsServiceCatalogIntegration,
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

    const instanceIdPathParam = event.pathParameters?.instanceId;
    const instanceIdPathParamNumber = Number(instanceIdPathParam);

    if (Number.isNaN(instanceIdPathParamNumber)) {
        throw InvalidPathParamsError('instanceId must be a number');
    }

    const instance = await instanceService.getInstanceById(instanceIdPathParamNumber);

    if (instance === undefined) {
        throw new Error('Instance not found');
    }

    if (!authService.hasUserRoleOrAbove('ADMIN', role) && instance.userId !== userIdToUse) {
        throw new Error('You are not authorized to perform this action');
    }

    const result = await instanceService.deleteInstance(instanceIdPathParamNumber);

    if (result === undefined) {
        throw new Error('Instance not found');
    }

    return {
        statusCode: 200,
    };
}, true);
