import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { UpdateGroup } from '../../../application/use-cases/group/update-group';
import { z } from 'zod';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseGroupRepository } from '../../../infrastructure/group-repository/database-group-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { Errors } from '../../../domain/dtos/errors';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const groupRepository = new DatabaseGroupRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const updateGroup = new UpdateGroup(logger, auth, groupRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const body = z
            .object({
                name: z.string().optional(),
                description: z.string().optional(),
            })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!body.success) throw Errors.validationError(body.error);

        const output = await updateGroup.execute({
            principal: CognitoAuth.extractPrincipal(event),
            groupId: event.pathParameters?.groupId ?? '',
            name: body.data.name,
            description: body.data.description,
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
