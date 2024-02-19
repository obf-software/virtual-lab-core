import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { z } from 'zod';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseUserRepository } from '../../../infrastructure/user-repository/database-user-repository';
import { ListUsers } from '../../../application/use-cases/user/list-users';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { Errors } from '../../../domain/dtos/errors';
import { seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const listUsers = new ListUsers(logger, auth, userRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const query = z
            .object({
                orderBy: z
                    .enum(['creationDate', 'lastUpdateDate', 'lastLoginDate', 'alphabetical'])
                    .default('creationDate'),
                order: z.enum(['asc', 'desc']).default('asc'),
                groupId: z.string().optional(),
                textSearch: z.string().optional(),
            })
            .extend(seekPaginationInputSchema.shape)
            .safeParse({ ...event.queryStringParameters });
        if (!query.success) throw Errors.validationError(query.error);

        const output = await listUsers.execute({
            principal: CognitoAuth.extractPrincipal(event),
            orderBy: query.data.orderBy,
            order: query.data.order,
            pagination: {
                resultsPerPage: query.data.resultsPerPage,
                page: query.data.page,
            },
            groupId: query.data.groupId,
            textSearch: query.data.textSearch,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
