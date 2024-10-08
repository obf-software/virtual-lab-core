import { z } from 'zod';
import { ListInstanceTemplates } from '../../../application/use-cases/instance-template/list-instance-templates';
import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseInstanceTemplateRepository } from '../../../infrastructure/instance-template-repository/database-instance-template-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { seekPaginationInputSchema } from '../../../domain/dtos/seek-paginated';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, DATABASE_URL_PARAMETER_NAME } = process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault({ AWS_REGION })
        : new LambdaLayerConfigVault({ AWS_SESSION_TOKEN });
const instanceTemplateRepository = new DatabaseInstanceTemplateRepository({
    configVault,
    DATABASE_URL_PARAMETER_NAME,
});
const listInstanceTemplates = new ListInstanceTemplates(logger, auth, instanceTemplateRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const { query } = LambdaHandlerAdapter.parseAPIRequest({
            event,
            querySchema: z
                .object({
                    createdBy: z.string().optional(),
                    textSearch: z.string().optional(),
                    orderBy: z
                        .enum(['creationDate', 'lastUpdateDate', 'alphabetical'])
                        .default('creationDate'),
                    order: z.enum(['asc', 'desc']).default('asc'),
                })
                .extend(seekPaginationInputSchema.shape),
        });

        const output = await listInstanceTemplates.execute({
            principal: CognitoAuth.extractPrincipal(event),
            createdBy: query.createdBy,
            textSearch: query.textSearch,
            orderBy: query.orderBy,
            order: query.order,
            pagination: {
                page: query.page,
                resultsPerPage: query.resultsPerPage,
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
