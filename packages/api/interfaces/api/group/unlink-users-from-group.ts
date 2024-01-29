import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { z } from 'zod';
import { UnlinkUsersFromGroup } from '../../../application/use-cases/group/unlink-users-from-group';
import { DatabaseGroupRepository } from '../../../infrastructure/group-repository/database-group-repository';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseUserRepository } from '../../../infrastructure/user-repository/database-user-repository';
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
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const unlinkUsersfromGroup = new UnlinkUsersFromGroup(
    logger,
    auth,
    groupRepository,
    userRepository,
);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const body = z
            .object({ userIds: z.array(z.string()).nonempty() })
            .safeParse(JSON.parse(event.body ?? '{}'));
        if (!body.success) throw Errors.validationError(body.error);

        await unlinkUsersfromGroup.execute({
            principal: CognitoAuth.extractPrincipal(event),
            groupId: event.pathParameters?.groupId ?? '',
            userIds: body.data.userIds,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
