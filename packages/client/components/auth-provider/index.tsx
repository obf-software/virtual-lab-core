'use client';

import '@aws-amplify/ui-react/styles.css';
import { Authenticator } from '@aws-amplify/ui-react';
import { PropsWithChildren } from 'react';
import { Amplify } from 'aws-amplify';
import { Box, Heading } from '@chakra-ui/react';

Amplify.configure({
    Auth: {
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID,
        userPoolWebClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID,
        authenticationFlowType: 'USER_SRP_AUTH',
    },
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <Authenticator
            initialState='signIn'
            loginMechanisms={['username', 'email']}
            hideSignUp
            variation='modal'
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
                            <Heading
                                as='h1'
                                size='xl'
                                textAlign='center'
                                py={6}
                            >
                                Virtual Lab
                            </Heading>
                        </Box>
                    );
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
