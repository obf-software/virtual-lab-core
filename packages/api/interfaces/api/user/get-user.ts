import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { GetUser } from '../../../application/use-cases/user/get-user';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lambaLayerConfigVault';
import { DatabaseUserRepository } from '../../../infrastructure/user-repository/database-user-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/lambda-handler-adapter';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const getUser = new GetUser(logger, auth, userRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const userId = event.pathParameters?.userId;

        const output = await getUser.execute({
            principal: CognitoAuth.extractPrincipal(event),
            userId: userId === 'me' ? undefined : userId,
        });
        await userRepository.disconnect();

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
