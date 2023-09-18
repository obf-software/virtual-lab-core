/* eslint-disable react/prop-types */
import '@aws-amplify/ui-react/styles.css';
import { Authenticator } from '@aws-amplify/ui-react';
import { PropsWithChildren } from 'react';
import { Amplify } from 'aws-amplify';
import { Box, Heading } from '@chakra-ui/react';

Amplify.configure({
    aws_appsync_graphqlEndpoint: import.meta.env.VITE_APP_APP_SYNC_API_URL,
    aws_appsync_region: import.meta.env.VITE_APP_AWS_REGION,
    aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    Auth: {
        region: import.meta.env.VITE_APP_AWS_REGION,
        userPoolId: import.meta.env.VITE_APP_AWS_USER_POOL_ID,
        userPoolWebClientId: import.meta.env.VITE_APP_AWS_USER_POOL_CLIENT_ID,
        authenticationFlowType: 'USER_SRP_AUTH',
    },
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <Authenticator
            initialState='signIn'
            loginMechanisms={['username', 'email']}
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
                                fontFamily={'mono'}
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
