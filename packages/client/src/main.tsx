import './styles/global.css';
import '@aws-amplify/ui-react/styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './styles/theme';
import { MenuProvider } from './contexts/menu/provider.tsx';
import { AuthContainer } from './components/auth-container/index.tsx';
import { router } from './router.tsx';
import { ApplicationEventsProvider } from './contexts/application-events/provider.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/query-client.ts';
import { RouterProvider } from 'react-router-dom';
import { translations } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import { I18n } from 'aws-amplify/utils';

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
            identityPoolId: import.meta.env.VITE_APP_AWS_IDENTITY_POOL_ID,
            loginWith:
                import.meta.env.VITE_APP_ENABLE_IDENTITY_PROVIDER === 'true'
                    ? {
                          oauth: {
                              domain: import.meta.env.VITE_APP_AWS_USER_POOL_DOMAIN,
                              redirectSignIn: [window.location.origin],
                              redirectSignOut: [window.location.origin],
                              responseType: 'code',
                              scopes: [
                                  'openid',
                                  'email',
                                  'profile',
                                  'aws.cognito.signin.user.admin',
                              ],
                              providers: [
                                  {
                                      custom: import.meta.env.VITE_APP_AWS_IDENTITY_PROVIDER_NAME,
                                  },
                              ],
                          },
                      }
                    : undefined,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <AuthContainer>
                <QueryClientProvider client={queryClient}>
                    <ApplicationEventsProvider>
                        <MenuProvider>
                            <RouterProvider router={router} />
                        </MenuProvider>
                    </ApplicationEventsProvider>
                </QueryClientProvider>
            </AuthContainer>
        </ChakraProvider>
    </React.StrictMode>,
);
