import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
import { z } from 'zod';
import { InvalidBodyError } from '../../core/errors';
import { handlerAdapter } from '../../../infrastructure/lambda/handler-adapter';
import { Logger } from '@aws-lambda-powertools/logger';
import { GroupRepository, schema } from '../../../infrastructure/repositories';
import { CreateGroupUseCase } from '../create-group';
import { ServiceCatalog } from '../../../infrastructure/aws/service-catalog';
import { getRequestPrincipal } from '../../../infrastructure/auth/old/get-user-principal';

const { AWS_REGION, DATABASE_URL } = process.env;
const dbClient = drizzle(postgres(DATABASE_URL), { schema });
const logger = new Logger();

const createGroupUseCase = new CreateGroupUseCase({
    groupRepository: new GroupRepository(dbClient),
    serviceCatalog: new ServiceCatalog(AWS_REGION),
});

export const handler = handlerAdapter<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
    async (event) => {
        const body = z
            .object({
                name: z.string().max(128).nonempty(),
                description: z.string().nonempty(),
                awsPortfolioId: z.string().max(50).nonempty(),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!body.success) throw InvalidBodyError(body.error.message);

        const group = await createGroupUseCase.execute({
            principal: getRequestPrincipal(event),
            name: body.data.name,
            awsPortfolioId: body.data.awsPortfolioId,
            description: body.data.description,
        });

        return {
            statusCode: 201,
            body: JSON.stringify(group),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { isHttp: true, logger },
);
