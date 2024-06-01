import { Authenticator } from '@aws-amplify/ui-react';
import React, { PropsWithChildren } from 'react';
import { Box, Button, Image } from '@chakra-ui/react';
import { signInWithRedirect } from 'aws-amplify/auth';

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
