import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import * as sst from 'sst/constructs';
import { Config } from './Config';

const stagesWhereUserPoolIsRetained = ['production'];

export const Auth = ({ stack, app }: sst.StackContext) => {
    const { ssmParameters } = sst.use(Config);

    const preTokenGenerationTrigger = new sst.Function(stack, 'preTokenGenerationTrigger', {
        handler: 'packages/api/interfaces/events/on-pre-token-generation-trigger.handler',
        environment: {
            SHARED_SECRET_NAME: 'not-used-yet',
            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
        },
        permissions: ['ssm:*', 'secretsmanager:*'],
    });

    const postConfirmationTrigger = new sst.Function(stack, 'postConfirmationTrigger', {
        handler: 'packages/api/interfaces/events/on-post-confirmation-trigger.handler',
        environment: {
            SHARED_SECRET_NAME: 'not-used-yet',
            DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
        },
        permissions: ['ssm:*', 'secretsmanager:*'],
    });

    const userPool = new cognito.UserPool(stack, 'UserPool', {
        accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
        advancedSecurityMode: cognito.AdvancedSecurityMode.OFF,
        removalPolicy: stagesWhereUserPoolIsRetained.includes(app.stage)
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        mfa: cognito.Mfa.OPTIONAL,
        mfaSecondFactor: {
            otp: true,
            sms: true,
        },
        selfSignUpEnabled: true,
        lambdaTriggers: {
            preTokenGeneration: preTokenGenerationTrigger,
            postConfirmation: postConfirmationTrigger,
        },
        passwordPolicy: {
            minLength: 8,
            requireDigits: true,
            requireLowercase: true,
            requireSymbols: true,
            requireUppercase: true,
            tempPasswordValidity: cdk.Duration.days(30),
        },
        signInAliases: {
            email: true,
            preferredUsername: true,
            username: true,
        },
        userInvitation: {
            emailSubject: 'You are invited to join the Virtual Lab',
            emailBody:
                'Your username is <strong>{username}</strong> and temporary password is <strong>{####}</strong>',
        },
        userVerification: {
            emailStyle: cognito.VerificationEmailStyle.CODE,
            emailSubject: 'Your Virtual Lab verification code',
            emailBody: 'Your verification code is <strong>{####}</strong>',
        },
    });

    const userPoolDomain = new cognito.UserPoolDomain(stack, 'UserPoolDomain', {
        userPool,
        cognitoDomain: {
            domainPrefix: `${app.name}-${app.stage}`.toLowerCase(),
        },
    });

    const userPoolClient = new cognito.UserPoolClient(stack, 'UserPoolClient', {
        userPool,
        authFlows: {
            adminUserPassword: true,
            custom: true,
            userPassword: true,
            userSrp: true,
        },
        oAuth: {
            scopes: [
                cognito.OAuthScope.OPENID,
                cognito.OAuthScope.EMAIL,
                cognito.OAuthScope.PROFILE,
            ],
            flows: {
                authorizationCodeGrant: true,
                implicitCodeGrant: true,
            },

            /**
             * Update this to the URL of your frontend app.
             */
            callbackUrls: ['http://localhost:3000'],
            logoutUrls: ['http://localhost:3000'],
        },
        writeAttributes: new cognito.ClientAttributes().withStandardAttributes({
            preferredUsername: true,
            fullname: true,
            email: true,
        }),
    });

    const cognitoAuth = new sst.Cognito(stack, 'cognito', {
        login: ['email', 'preferredUsername', 'username'],
        cdk: { userPool, userPoolClient },
    });

    stack.addOutputs({
        userPoolId: cognitoAuth.userPoolId,
        userPoolClientId: cognitoAuth.userPoolClientId,
        userPoolDomainBaseUrl: userPoolDomain.baseUrl(),
    });

    return {
        userPool,
        userPoolClient,
        userPoolDomain,
    };
};
