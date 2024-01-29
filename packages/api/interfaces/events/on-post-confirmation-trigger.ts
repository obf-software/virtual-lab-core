import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { SignUpUser } from '../../application/use-cases/user/sign-up-user';
import { AWSConfigVault } from '../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../infrastructure/config-vault/lambaLayerConfigVault';
import { LambdaHandlerAdapter } from '../../infrastructure/lambda-handler-adapter';
import { AWSLogger } from '../../infrastructure/logger/aws-logger';
import { DatabaseUserRepository } from '../../infrastructure/user-repository/database-user-repository';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;
const logger = new AWSLogger();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const signUpUser = new SignUpUser(logger, userRepository);

export const handler = LambdaHandlerAdapter.adaptCustom<PostConfirmationTriggerHandler>(
    async (event) => {
        // @todo differentiate between self-register and sso
        await signUpUser.execute({
            username: event.userName,
            selfRegister: false,
        });
        return event;
    },
    { logger },
);
