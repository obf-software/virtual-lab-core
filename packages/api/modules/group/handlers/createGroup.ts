import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/schema';
import { GroupRepository } from '../repository';
import { GroupService } from '../service';
import { AuthService } from '../../auth/service';
import { AwsServiceCatalogIntegration } from '../../../integrations/aws-service-catalog/service';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { createHandler } from '../../../integrations/powertools';
import { z } from 'zod';
import { InvalidBodyError } from '../../core/errors';

// Config
const { AWS_REGION, DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// Integration
const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration({ AWS_REGION });

// Repository
const groupRepository = new GroupRepository(dbClient);

// Service
const groupService = new GroupService({ awsServiceCatalogIntegration, groupRepository });
const authService = new AuthService();

export const handler = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(async (event) => {
    const { role } = authService.getUserPoolJwtClaims(event);
    authService.throwIfInsufficientRole('ADMIN', role);

    const body = z
        .object({
            name: z.string().max(128).nonempty(),
            description: z.string().nonempty(),
            awsPortfolioId: z.string().max(50).nonempty(),
        })
        .safeParse(JSON.parse(event.body ?? '{}'));
    if (!body.success) throw InvalidBodyError(body.error.message);
    const { name, description, awsPortfolioId } = body.data;

    const result = await groupService.createGroup({ name, description, awsPortfolioId });

    return {
        statusCode: 201,
        body: JSON.stringify(result),
        headers: { 'Content-Type': 'application/json' },
    };
}, true);
