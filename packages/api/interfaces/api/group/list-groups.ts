import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { ListGroups } from '../../../application/use-cases/group/list-groups';
import { z } from 'zod';
import { DatabaseGroupRepository } from '../../../infrastructure/group-repository/database-group-repository';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { Errors } from '../../../domain/dtos/errors';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const groupRepository = new DatabaseGroupRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const listGroups = new ListGroups(logger, auth, groupRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const query = z
            .object({
                orderBy: z
                    .enum(['creationDate', 'lastUpdateDate', 'alphabetical'])
                    .default('creationDate'),
                order: z.enum(['asc', 'desc']).default('asc'),
                resultsPerPage: z.number({ coerce: true }).min(1).max(60).default(10),
                page: z.number({ coerce: true }).min(1).default(1),
                createdBy: z.string().optional(),
                userId: z.string().optional(),
                textSearch: z.string().optional(),
            })
            .safeParse({ ...event.queryStringParameters });
        if (!query.success) throw Errors.validationError(query.error);

        const output = await listGroups.execute({
            principal: CognitoAuth.extractPrincipal(event),
            orderBy: query.data.orderBy,
            order: query.data.order,
            pagination: {
                resultsPerPage: query.data.resultsPerPage,
                page: query.data.page,
            },
            createdBy: query.data.createdBy,
            userId: query.data.userId,
            textSearch: query.data.textSearch,
        });
        await groupRepository.disconnect();

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
