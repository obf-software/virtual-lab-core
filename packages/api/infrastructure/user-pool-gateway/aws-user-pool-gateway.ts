import {
    CognitoIdentityProviderClient,
    DescribeUserPoolCommand,
    UpdateUserPoolCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UserPoolGateway } from '../../application/user-pool-gateway';
import { Errors } from '../../domain/dtos/errors';

export class AWSUserPoolGateway implements UserPoolGateway {
    private cognitoIdentityProviderClient: CognitoIdentityProviderClient;

    constructor(
        private readonly deps: {
            readonly AWS_REGION: string;
            readonly COGNITO_USER_POOL_ID: string;
        },
    ) {
        this.cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
            region: deps.AWS_REGION,
        });
    }

    updateUserPool = async (props: {
        preSignUpLambdaArn?: string;
        postConfirmationLambdaArn?: string;
        preTokenGenerationLambdaArn?: string;
        inviteUserEmailSubject?: string;
        inviteUserEmailMessage?: string;
        inviteUserSmsMessage?: string;
        verificationEmailSubject?: string;
        verificationEmailMessage?: string;
        verificationSmsMessage?: string;
    }): Promise<void> => {
        const { UserPool } = await this.cognitoIdentityProviderClient.send(
            new DescribeUserPoolCommand({ UserPoolId: this.deps.COGNITO_USER_POOL_ID }),
        );

        if (UserPool === undefined) {
            throw Errors.internalError(
                `Cognito User Pool with ID ${this.deps.COGNITO_USER_POOL_ID} not found`,
            );
        }

        await this.cognitoIdentityProviderClient.send(
            new UpdateUserPoolCommand({
                ...UserPool,
                UserPoolId: UserPool.Id,
                LambdaConfig: {
                    ...UserPool.LambdaConfig,
                    PreSignUp: props.preSignUpLambdaArn ?? UserPool.LambdaConfig?.PreSignUp,
                    PostConfirmation:
                        props.postConfirmationLambdaArn ?? UserPool.LambdaConfig?.PostConfirmation,
                    PreTokenGeneration:
                        props.preTokenGenerationLambdaArn ??
                        UserPool.LambdaConfig?.PreTokenGeneration,
                },
                AdminCreateUserConfig: {
                    ...UserPool.AdminCreateUserConfig,
                    InviteMessageTemplate: {
                        ...UserPool.AdminCreateUserConfig?.InviteMessageTemplate,
                        EmailMessage:
                            props.inviteUserEmailMessage ??
                            UserPool.AdminCreateUserConfig?.InviteMessageTemplate?.EmailMessage,
                        EmailSubject:
                            props.inviteUserEmailSubject ??
                            UserPool.AdminCreateUserConfig?.InviteMessageTemplate?.EmailSubject,
                        SMSMessage:
                            props.inviteUserSmsMessage ??
                            UserPool.AdminCreateUserConfig?.InviteMessageTemplate?.SMSMessage,
                    },
                    UnusedAccountValidityDays: undefined,
                },
                VerificationMessageTemplate: {
                    ...UserPool.VerificationMessageTemplate,
                    EmailMessage:
                        props.verificationEmailMessage ??
                        UserPool.VerificationMessageTemplate?.EmailMessage,
                    EmailSubject:
                        props.verificationEmailSubject ??
                        UserPool.VerificationMessageTemplate?.EmailSubject,
                    SmsMessage:
                        props.verificationSmsMessage ??
                        UserPool.VerificationMessageTemplate?.SmsMessage,
                },
            }),
        );
    };
}
