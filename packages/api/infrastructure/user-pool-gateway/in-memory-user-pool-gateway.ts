import { UserPoolGateway } from '../../application/user-pool-gateway';

export class InMemoryUserPoolGateway implements UserPoolGateway {
    // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
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
    }): Promise<void> => Promise.resolve();
}
