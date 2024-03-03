import { PreTokenGenerationTriggerHandler } from 'aws-lambda';
import { SignInUser } from '../../application/use-cases/user/sign-in-user';
import { AWSLogger } from '../../infrastructure/logger/aws-logger';
import { DatabaseUserRepository } from '../../infrastructure/user-repository/database-user-repository';
import { AWSConfigVault } from '../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../infrastructure/config-vault/lambaLayerConfigVault';
import { LambdaHandlerAdapter } from '../../infrastructure/lambda-handler-adapter';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, SHARED_SECRET_NAME, DATABASE_URL_PARAMETER_NAME } =
    process.env;
const logger = new AWSLogger();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault(AWS_REGION, SHARED_SECRET_NAME)
        : new LambdaLayerConfigVault(AWS_SESSION_TOKEN, SHARED_SECRET_NAME);
const userRepository = new DatabaseUserRepository(configVault, DATABASE_URL_PARAMETER_NAME);
const signInUser = new SignInUser(logger, userRepository);

export const handler = LambdaHandlerAdapter.adaptCustom<PreTokenGenerationTriggerHandler>(
    async (event) => {
        const user = await signInUser.execute({
            username: event.userName,
            shouldUpdateLastLoginAt:
                event.triggerSource === 'TokenGeneration_Authentication' ||
                event.triggerSource === 'TokenGeneration_HostedAuth',
        });

        const outputEvent = event;
        outputEvent.response = {
            claimsOverrideDetails: {
                claimsToAddOrOverride: {
                    'custom:role': user.getData().role,
                    'custom:userId': user.id,
                },
            },
        };

        return outputEvent;
    },
    { logger },
);
