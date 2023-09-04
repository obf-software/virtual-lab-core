'use client';
import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { Amplify } from 'aws-amplify';
import { theme } from './theme';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
    Auth: {
        region: process.env.NEXT_PUBLIC_AWS_REGION,
        userPoolId: process.env.NEXT_PUBLIC_AWS_USER_POOL_ID,
        userPoolWebClientId: process.env.NEXT_PUBLIC_AWS_USER_POOL_CLIENT_ID,
        cookieStorage: {
            domain: '.yourdomain.com',
            path: '/',
            expires: 365,
            sameSite: 'lax',
            secure: true,
        },
        authenticationFlowType: 'USER_SRP_AUTH',
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CacheProvider>
            <ChakraProvider theme={theme}>
                <Authenticator initialState='signIn' loginMechanisms={['email', 'username']}>
                    {children}
                </Authenticator>
            </ChakraProvider>
        </CacheProvider>
    );
}
