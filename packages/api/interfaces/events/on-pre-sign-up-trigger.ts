import { PreSignUpTriggerHandler } from 'aws-lambda';
import { SignUpUser } from '../../application/use-cases/user/sign-up-user';
import { AWSConfigVault } from '../../infrastructure/config-vault/aws-config-vault';
import { LambdaLayerConfigVault } from '../../infrastructure/config-vault/lamba-layer-config-vault';
import { LambdaHandlerAdapter } from '../../infrastructure/handler-adapter/lambda-handler-adapter';
import { AWSLogger } from '../../infrastructure/logger/aws-logger';
import { DatabaseUserRepository } from '../../infrastructure/user-repository/database-user-repository';
import { AwsVirtualizationGateway } from '../../infrastructure/virtualization-gateway/aws-virtualization-gateway';
import { z } from 'zod';
import { roleSchema } from '../../domain/dtos/role';

const {
    IS_LOCAL,
    AWS_REGION,
    AWS_SESSION_TOKEN,
    DATABASE_URL_PARAMETER_NAME,
    SNS_TOPIC_ARN,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
    EVENT_BUS_ARN,
    EVENT_BUS_PUBLISHER_ROLE_ARN,
} = process.env;
const logger = new AWSLogger();
const configVault =
    IS_LOCAL === 'true'
        ? new AWSConfigVault({ AWS_REGION })
        : new LambdaLayerConfigVault({ AWS_SESSION_TOKEN });
const userRepository = new DatabaseUserRepository({ configVault, DATABASE_URL_PARAMETER_NAME });
const virtualizationGateway = new AwsVirtualizationGateway({
    configVault,
    AWS_REGION,
    SNS_TOPIC_ARN,
    SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME,
    SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME,
    EVENT_BUS_ARN,
    EVENT_BUS_PUBLISHER_ROLE_ARN,
});
const signUpUser = new SignUpUser(logger, userRepository, virtualizationGateway);

export const handler = LambdaHandlerAdapter.adaptCustom<PreSignUpTriggerHandler>(
    async (event) => {
        const clientMetadataValidation = z
            .object({
                role: roleSchema.optional(),
            })
            .safeParse(event.request.clientMetadata);

        const role = clientMetadataValidation.success
            ? clientMetadataValidation.data.role
            : undefined;

        await signUpUser.execute({
            username: event.userName,
            name: event.request.userAttributes.name,
            preferredUsername: event.request.userAttributes.preferred_username,
            role,
        });

        return event;
    },
    { logger },
);
