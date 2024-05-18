import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as cdk from 'aws-cdk-lib';
import * as sst from 'sst/constructs';
import { Core } from './Core';
import { featureFlagIsEnabled } from './config/feature-flags';

export const Auth = ({ stack, app }: sst.StackContext) => {
    const {
        ssmParameters,
        defaultEventBus,
        defaultSnsTopic,
        defaultEventBusPublisherRole,
        paramsAndSecretsLambdaExtension,
    } = sst.use(Core);

    const triggerEnvironment: Record<string, string> = {
        DATABASE_URL_PARAMETER_NAME: ssmParameters.databaseUrl.name,
        SERVICE_CATALOG_LINUX_PRODUCT_ID_PARAMETER_NAME:
            ssmParameters.serviceCatalogLinuxProductId.name,
        SERVICE_CATALOG_WINDOWS_PRODUCT_ID_PARAMETER_NAME:
            ssmParameters.serviceCatalogWindowsProductId.name,
        SNS_TOPIC_ARN: defaultSnsTopic.topicArn,
        EVENT_BUS_ARN: defaultEventBus.eventBusArn,
        EVENT_BUS_PUBLISHER_ROLE_ARN: defaultEventBusPublisherRole.roleArn,
    };

    const triggerPermissions: sst.Permissions = [
        'ssm:*',
        'secretsmanager:*',
        'cloudformation:*',
        'servicecatalog:*',
        'ec2:*',
        's3:*',
        'iam:*',
        'sns:*',
        'scheduler:*',
        'events:*',
    ];

    const preTokenGenerationTrigger = new sst.Function(stack, 'preTokenGenerationTrigger', {
        handler: 'packages/api/interfaces/events/on-pre-token-generation-trigger.handler',
        environment: triggerEnvironment,
        permissions: triggerPermissions,
        paramsAndSecrets: paramsAndSecretsLambdaExtension,
    });

    const preSignUpTrigger = new sst.Function(stack, 'preSignUpTrigger', {
        handler: 'packages/api/interfaces/events/on-pre-sign-up-trigger.handler',
        environment: triggerEnvironment,
        permissions: triggerPermissions,
        paramsAndSecrets: paramsAndSecretsLambdaExtension,
    });

    const postConfirmationTrigger = new sst.Function(stack, 'postConfirmationTrigger', {
        handler: 'packages/api/interfaces/events/on-post-confirmation-trigger.handler',
        environment: triggerEnvironment,
        permissions: triggerPermissions,
        paramsAndSecrets: paramsAndSecretsLambdaExtension,
    });

    let userPoolRemovalPolicy: cdk.RemovalPolicy = cdk.RemovalPolicy.DESTROY;
    if (
        featureFlagIsEnabled({
            featureFlag: 'RETAIN_USER_POOL_ON_DELETE',
            components: ['User Pool Retain Removal Policy'],
            forceDisable: app.mode === 'dev',
        })
    ) {
        userPoolRemovalPolicy = cdk.RemovalPolicy.RETAIN;
    }

    const userPool = new cognito.UserPool(stack, 'UserPool', {
        accountRecovery: cognito.AccountRecovery.EMAIL_AND_PHONE_WITHOUT_MFA,
        advancedSecurityMode: cognito.AdvancedSecurityMode.OFF,
        removalPolicy: userPoolRemovalPolicy,
        mfa: cognito.Mfa.OPTIONAL,
        mfaSecondFactor: {
            otp: true,
            sms: true,
        },
        selfSignUpEnabled: true,
        lambdaTriggers: {
            preTokenGeneration: preTokenGenerationTrigger,
            preSignUp: preSignUpTrigger,
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

    let userPoolIdentityProvider: cognito.UserPoolIdentityProviderOidc | undefined;
    if (
        featureFlagIsEnabled({
            featureFlag: 'USER_POOL_IDENTITY_PROVIDER',
            components: ['User Pool Identity Provider'],
        })
    ) {
        const clientId = process.env.USER_POOL_IDENTITY_PROVIDER_CLIENT_ID;
        const clientSecret = process.env.USER_POOL_IDENTITY_PROVIDER_CLIENT_SECRET;
        const issuerUrl = process.env.USER_POOL_IDENTITY_PROVIDER_ISSUER_URL;

        if (!clientId || !clientSecret || !issuerUrl) {
            throw new Error(`Invalid Auth stack user pool identity provider configuration`, {
                cause: {
                    clientId: !!clientId,
                    clientSecret: !!clientSecret,
                    issuerUrl: !!issuerUrl,
                },
            });
        }

        userPoolIdentityProvider = new cognito.UserPoolIdentityProviderOidc(
            stack,
            'UserPoolIdentityProvider',
            {
                userPool,
                clientId,
                clientSecret,
                issuerUrl,
                attributeRequestMethod: cognito.OidcAttributeRequestMethod.GET,
                identifiers: ['oidc'],
                name: 'oidc',
                scopes: ['openid', 'email', 'profile'],
                attributeMapping: {
                    fullname: {
                        attributeName: 'name',
                    },
                    preferredUsername: {
                        attributeName: 'preferred_username',
                    },
                    email: {
                        attributeName: 'email',
                    },
                },
            },
        );
    }

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
                cognito.OAuthScope.COGNITO_ADMIN,
            ],
            flows: {
                authorizationCodeGrant: true,
            },
            /**
             * Those URLs are updated in the client stack
             */
            callbackUrls: ['http://localhost:5173'],
            logoutUrls: ['http://localhost:5173'],
        },
    });

    const cognitoAuth = new sst.Cognito(stack, 'cognito', {
        login: ['email', 'preferredUsername', 'username'],
        cdk: { userPool, userPoolClient },
    });

    stack.addOutputs({
        userPoolId: cognitoAuth.userPoolId,
        userPoolClientId: cognitoAuth.userPoolClientId,
        identityProviderRedirectUri: cognitoAuth.cognitoIdentityPoolId
            ? `${userPoolDomain.baseUrl()}/oauth2/idpresponse`
            : undefined,
        userPoolDomainBaseUrl: userPoolDomain.baseUrl(),
    });

    return {
        userPool,
        userPoolIdentityProvider,
        identityPoolId: cognitoAuth.cognitoIdentityPoolId,
        userPoolClient,
        userPoolDomain,
    };
};
