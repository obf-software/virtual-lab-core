import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { GroupRepository } from '../repository';
import { GroupService } from '../service';
import { AuthService } from '../../auth/service';
import { AwsServiceCatalogIntegration } from '../../../integrations/aws-service-catalog/service';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../../integrations/powertools';
import { InvalidPathParamsError } from '../../core/errors';

const { AWS_REGION, DATABASE_URL } = process.env;

const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration(AWS_REGION);
const groupRepository = new GroupRepository(dbClient);
const groupService = new GroupService(groupRepository, awsServiceCatalogIntegration);
const authService = new AuthService();

export const handler = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const { role } = authService.getUserPoolJwtClaims(event);
    authService.throwIfInsufficientRole('ADMIN', role);

    const groupIdPathParam = event.pathParameters?.groupId;
    const groupIdPathParamNumber = Number(groupIdPathParam);

    if (Number.isNaN(groupIdPathParamNumber)) {
        throw InvalidPathParamsError('groupId must be a number');
    }

    await groupService.deleteGroup(groupIdPathParamNumber);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Group deleted' }),
        headers: { 'Content-Type': 'application/json' },
    };
}, true);
