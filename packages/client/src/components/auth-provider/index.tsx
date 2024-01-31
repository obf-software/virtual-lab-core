import '@aws-amplify/ui-react/styles.css';
import { Authenticator, translations } from '@aws-amplify/ui-react';
import React, { PropsWithChildren } from 'react';
import { Amplify } from 'aws-amplify';
import { I18n } from 'aws-amplify/utils';
import { Box, Heading } from '@chakra-ui/react';

I18n.putVocabularies(translations);
I18n.setLanguage('pt');

Amplify.configure({
    API: {
        GraphQL: {
            endpoint: import.meta.env.VITE_APP_APP_SYNC_API_URL,
            region: import.meta.env.VITE_APP_AWS_REGION,
            defaultAuthMode: 'userPool',
        },
    },
    Auth: {
        Cognito: {
            userPoolId: import.meta.env.VITE_APP_AWS_USER_POOL_ID,
            userPoolClientId: import.meta.env.VITE_APP_AWS_USER_POOL_CLIENT_ID,
        },
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
