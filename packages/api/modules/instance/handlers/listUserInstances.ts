import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../../integrations/powertools';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { AwsEc2Integration } from '../../../integrations/aws-ec2/service';
import { GuacamoleIntegration } from '../../../integrations/guacamole/service';
import { InstanceRepository } from '../repository';
import { InstanceService } from '../service';
import { AuthService } from '../../auth/service';
import { z } from 'zod';
import { InvalidQueryParamsError } from '../../core/errors';
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

    const query = z
        .object({
            resultsPerPage: z.string().default('10').transform(Number),
            page: z.string().default('1').transform(Number),
        })
        .safeParse({ ...event.queryStringParameters });
    if (!query.success) throw InvalidQueryParamsError(query.error.message);
    const { resultsPerPage, page } = query.data;

    const result = await instanceService.listUserInstances(userId, { resultsPerPage, page });

    return {
        statusCode: 200,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json' },
    };
}, true);
