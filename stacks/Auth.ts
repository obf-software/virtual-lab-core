import {
    AccountRecovery,
    AdvancedSecurityMode,
    ClientAttributes,
    Mfa,
    OAuthScope,
    UserPool,
    UserPoolClient,
    UserPoolDomain,
    VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito';
import { Duration, RemovalPolicy } from 'aws-cdk-lib/core';
import * as sst from 'sst/constructs';
import { Config } from './Config';

const stagesWhereUserPoolIsRetained = ['production'];

export const Auth = ({ stack, app }: sst.StackContext) => {
    const { DATABASE_URL } = sst.use(Config);

    const preTokenGenerationTrigger = new sst.Function(stack, 'preTokenGenerationTrigger', {
        handler: 'packages/api/modules/user/handlers/pre-token-generation-trigger.handler',
        runtime: 'nodejs18.x',
        environment: {
            DATABASE_URL,
        },
    });

    const postConfirmationTrigger = new sst.Function(stack, 'postConfirmationTrigger', {
        handler: 'packages/api/modules/user/handlers/post-confirmation-trigger.handler',
        runtime: 'nodejs18.x',
        environment: {
            DATABASE_URL,
        },
    });

    const userPool = new UserPool(stack, 'UserPool', {
        accountRecovery: AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
        advancedSecurityMode: AdvancedSecurityMode.OFF,
        removalPolicy: stagesWhereUserPoolIsRetained.includes(app.stage)
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        mfa: Mfa.OPTIONAL,
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
            tempPasswordValidity: Duration.days(30),
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
            emailStyle: VerificationEmailStyle.CODE,
            emailSubject: 'Your Virtual Lab verification code',
            emailBody: 'Your verification code is <strong>{####}</strong>',
        },
    });

    const userPoolDomain = new UserPoolDomain(stack, 'UserPoolDomain', {
        userPool,
        cognitoDomain: {
            domainPrefix: `${app.name}-${app.stage}`.toLowerCase(),
        },
    });

    const userPoolClient = new UserPoolClient(stack, 'UserPoolClient', {
        userPool,
        authFlows: {
            adminUserPassword: true,
            custom: true,
            userPassword: true,
            userSrp: true,
        },
        oAuth: {
            scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
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
        writeAttributes: new ClientAttributes().withStandardAttributes({
            preferredUsername: true,
            fullname: true,
            email: true,
        }),
    });

    const cognito = new sst.Cognito(stack, 'cognito', {
        login: ['email', 'preferredUsername', 'username'],
        cdk: { userPool, userPoolClient },
    });

    stack.addOutputs({
        userPoolId: cognito.userPoolId,
        userPoolClientId: cognito.userPoolClientId,
        userPoolDomainBaseUrl: userPoolDomain.baseUrl(),
    });

    return {
        userPool,
        userPoolClient,
        userPoolDomain,
        cognito,
    };
};
