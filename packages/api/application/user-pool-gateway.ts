export interface UserPoolGateway {
    updateUserPool(props: {
        preSignUpLambdaArn?: string;
        postConfirmationLambdaArn?: string;
        preTokenGenerationLambdaArn?: string;
        inviteUserEmailSubject?: string;
        inviteUserEmailMessage?: string;
        inviteUserSmsMessage?: string;
        verificationEmailSubject?: string;
        verificationEmailMessage?: string;
        verificationSmsMessage?: string;
    }): Promise<void>;

    updateUserPoolClient(props: {
        clientId: string;
        callbackUrls?: string[];
        logoutUrls?: string[];
    }): Promise<void>;
}
