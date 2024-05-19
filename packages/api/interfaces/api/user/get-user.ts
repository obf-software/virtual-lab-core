import { CognitoAuth } from '../../../infrastructure/auth/cognito-auth';
import { GetUser } from '../../../application/use-cases/user/get-user';
import { AWSLogger } from '../../../infrastructure/logger/aws-logger';
import { AWSConfigVault } from '../../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../../infrastructure/config-vault/lamba-layer-config-vault';
import { DatabaseUserRepository } from '../../../infrastructure/user-repository/database-user-repository';
import { LambdaHandlerAdapter } from '../../../infrastructure/handler-adapter/lambda-handler-adapter';
import { z } from 'zod';

const { IS_LOCAL, AWS_REGION, AWS_SESSION_TOKEN, DATABASE_URL_PARAMETER_NAME } = process.env;
const logger = new AWSLogger();
const auth = new CognitoAuth();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault({ AWS_REGION })
        : new LambdaLayerConfigVault({ AWS_SESSION_TOKEN });
const userRepository = new DatabaseUserRepository({ configVault, DATABASE_URL_PARAMETER_NAME });
const getUser = new GetUser(logger, auth, userRepository);

export const handler = LambdaHandlerAdapter.adaptAPIWithUserPoolAuthorizer(
    async (event) => {
        const { path } = LambdaHandlerAdapter.parseAPIRequest({
            event,
            pathSchema: z.object({
                userId: z.string().transform((value) => (value === 'me' ? undefined : value)),
            }),
        });

        const output = await getUser.execute({
            principal: CognitoAuth.extractPrincipal(event),
            userId: path.userId,
        });

        return {
            statusCode: 200,
            body: JSON.stringify(output),
            headers: { 'Content-Type': 'application/json' },
        };
    },
    { logger },
);
