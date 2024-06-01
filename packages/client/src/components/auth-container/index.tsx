import { Authenticator } from '@aws-amplify/ui-react';
import React, { PropsWithChildren } from 'react';
import { Box, Button, Image } from '@chakra-ui/react';
import { signInWithRedirect } from 'aws-amplify/auth';
import { I18n } from 'aws-amplify/utils';

I18n.putVocabulariesForLanguage('pt', {
    'Reset Password': 'Redefinir senha',
    'Password must have at least 8 characters': 'A senha deve ter pelo menos 8 caracteres',
    'Your passwords must match': 'As senhas devem ser iguais',
    'Password did not conform with policy': 'A senha não está de acordo com a política',
    'Username cannot be of email format, since user pool is configured for email alias.':
        'O nome de usuário não pode ser no formato de e-mail',
    'Password did not conform with policy: Password must have lowercase characters':
        'A senha deve ter caracteres minúsculos',
    'Password did not conform with policy: Password must have uppercase characters':
        'A senha deve ter caracteres maiúsculos',
    'Password did not conform with policy: Password must have numeric characters':
        'A senha deve ter caracteres numéricos',
    'Password did not conform with policy: Password must have symbol characters':
        'A senha deve ter caracteres especiais',
});

export const AuthContainer: React.FC<PropsWithChildren> = ({ children }) => {
    const enableIdentityProvider = import.meta.env.VITE_APP_ENABLE_IDENTITY_PROVIDER === 'true';
    const hideSignUp = import.meta.env.VITE_APP_AWS_USER_POOL_SELF_SIGN_UP === 'false';
    const [isIdentityProviderButtonLoading, setIsIdentityProviderButtonLoading] =
        React.useState<boolean>(false);

    const oAuthButton: JSX.Element = (
        <Box
            h={'42px'}
            px={8}
            mt={2}
            mb={4}
        >
            <Button
                isLoading={isIdentityProviderButtonLoading}
                leftIcon={
                    <Image
                        src={'logo-utfpr.png'}
                        h={4}
                    />
                }
                fontWeight={'normal'}
                variant={'outline'}
                borderColor={'black'}
                w={'100%'}
                h={'100%'}
                _hover={{
                    borderColor: '#047d95',
                    bgColor: '#e9f9fc',
                }}
                onClick={() => {
                    setIsIdentityProviderButtonLoading(true);

                    signInWithRedirect({
                        provider: {
                            custom: import.meta.env.VITE_APP_AWS_IDENTITY_PROVIDER_NAME,
                        },
                    }).catch((error) => {
                        setIsIdentityProviderButtonLoading(false);

                        console.error('Error signing in with custom provider', error);
                    });
                }}
            >
                Entrar com a UTFPR
            </Button>
        </Box>
    );

    return (
        <Authenticator
            initialState='signIn'
            loginMechanisms={['username', 'email']}
            variation='modal'
            hideSignUp={hideSignUp}
            formFields={{
                signIn: {
                    username: {
                        label: 'Usuário ou e-mail',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'username email',
                    },
                    password: {
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'current-password',
                    },
                },
                signUp: {
                    username: {
                        label: 'Usuário',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'username',
                    },
                    email: {
                        label: 'E-mail',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'email',
                    },
                    password: {
                        label: 'Senha',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'new-password',
                    },
                    confirm_password: {
                        label: 'Confirme a senha',
                        placeholder: 'As senhas devem ser iguais',
                        isRequired: true,
                        autocomplete: 'new-password',
                    },
                },
                confirmSignUp: {
                    confirmation_code: {
                        label: 'Código de confirmação',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'one-time-code',
                    },
                },
                forgotPassword: {
                    username: {
                        label: 'Usuário ou e-mail',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'username email',
                    },
                },
                confirmResetPassword: {
                    confirmation_code: {
                        label: 'Código de confirmação',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'one-time-code',
                    },
                    password: {
                        label: 'Nova senha',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'new-password',
                    },
                    confirm_password: {
                        label: 'Confirme a nova senha',
                        placeholder: 'As senhas devem ser iguais',
                        isRequired: true,
                        autocomplete: 'new-password',
                    },
                },
                forceNewPassword: {
                    password: {
                        label: 'Nova senha',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'new-password',
                    },
                    confirm_password: {
                        label: 'Confirme a nova senha',
                        placeholder: 'As senhas devem ser iguais',
                        isRequired: true,
                        autocomplete: 'new-password',
                    },
                },
                setupTotp: {
                    confirmation_code: {
                        label: 'Código de confirmação',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'one-time-code',
                    },
                },
                confirmSignIn: {
                    confirmation_code: {
                        label: 'Código de confirmação',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'one-time-code',
                    },
                },
                confirmVerifyUser: {
                    confirmation_code: {
                        label: 'Código de confirmação',
                        placeholder: '',
                        isRequired: true,
                        autocomplete: 'one-time-code',
                    },
                },
            }}
            components={{
                Header: () => {
                    return (
                        <Box
                            bgColor={'white'}
                            roundedTop={8}
                            borderTop={'4px'}
                            borderLeft={'1px'}
                            borderRight={'1px'}
                        >
                            <Image
                                src={'logo-light.png'}
                                alt={'Logo'}
                                h={200}
                                mx={'auto'}
                            />
                        </Box>
                    );
                },
                SignIn: {
                    Header: () => {
                        if (!enableIdentityProvider) {
                            return null;
                        }

                        return oAuthButton;
                    },
                },
                SignUp: {
                    Header: () => {
                        if (!enableIdentityProvider) {
                            return null;
                        }
                        return oAuthButton;
                    },
                },
                Footer: () => {
                    return (
                        <Box
                            bgColor={'white'}
                            roundedBottom={8}
                            borderBottom={'4px'}
                            borderLeft={'1px'}
                            borderRight={'1px'}
                        />
                    );
                },
            }}
        >
            {children}
        </Authenticator>
    );
};
