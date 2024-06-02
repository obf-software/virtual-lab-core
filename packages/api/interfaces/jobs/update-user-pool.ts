import { Handler } from 'aws-lambda';
import { z } from 'zod';
import { AWSLogger } from '../../infrastructure/logger/aws-logger';
import { AWSUserPoolGateway } from '../../infrastructure/user-pool-gateway/aws-user-pool-gateway';
import { LambdaHandlerAdapter } from '../../infrastructure/handler-adapter/lambda-handler-adapter';
import { Errors } from '../../domain/dtos/errors';

const { AWS_REGION, COGNITO_USER_POOL_ID } = process.env;

const logger = new AWSLogger();
const usePoolGateway = new AWSUserPoolGateway({
    AWS_REGION,
    COGNITO_USER_POOL_ID,
});

const handlerParamsSchema = z.object({
    preSignUpLambdaArn: z.string().optional(),
    postConfirmationLambdaArn: z.string().optional(),
    preTokenGenerationLambdaArn: z.string().optional(),
    inviteUserEmailSubject: z.string().optional(),
    inviteUserEmailMessage: z.string().optional(),
    inviteUserSmsMessage: z.string().optional(),
    verificationEmailSubject: z.string().optional(),
    verificationEmailMessage: z.string().optional(),
    verificationSmsMessage: z.string().optional(),
});
type HandlerParams = z.infer<typeof handlerParamsSchema>;

export const handler = LambdaHandlerAdapter.adaptCustom<Handler<{ params: HandlerParams }, void>>(
    async (event) => {
        const paramsValidation = handlerParamsSchema.safeParse(event.params);
        if (!paramsValidation.success) throw Errors.validationError(paramsValidation.error);
        const params = paramsValidation.data;

        await usePoolGateway.updateUserPool({
            preSignUpLambdaArn: params.preSignUpLambdaArn,
            preTokenGenerationLambdaArn: params.preTokenGenerationLambdaArn,
            postConfirmationLambdaArn: params.postConfirmationLambdaArn,
            verificationEmailSubject: params.verificationEmailSubject,
            verificationEmailMessage: params.verificationEmailMessage,
            verificationSmsMessage: params.verificationSmsMessage,
            inviteUserEmailSubject: params.inviteUserEmailSubject,
            inviteUserEmailMessage: params.inviteUserEmailMessage,
            inviteUserSmsMessage: params.inviteUserSmsMessage,
        });

        logger.info(`User pool updated successfully`, { params });
    },
    { logger },
);
