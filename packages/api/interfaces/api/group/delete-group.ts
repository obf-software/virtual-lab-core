import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { DeleteGroup } from '../../../application/use-cases/group/delete-group';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseGroupRepository } from '../../../infrastructure/group-repository/database-group-repository';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const groupRepository = new DatabaseGroupRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const deleteGroup = new DeleteGroup(logger, auth, groupRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        await deleteGroup.execute({
            principal: CognitoAuth.extractPrincipal(event),
            groupId: event.pathParameters?.groupId ?? '',
        });
        await groupRepository.disconnect();

        return {
            statusCode: 202,
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
