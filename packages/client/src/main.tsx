import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './styles/theme';
import { MenuProvider } from './contexts/menu/provider.tsx';
import { AuthProvider } from './components/auth-provider/index.tsx';
import { Router } from './router.tsx';
import { ApplicationEventsProvider } from './contexts/application-events/provider.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/query/service.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <ApplicationEventsProvider>
                        <MenuProvider>
                            <Router />
                        </MenuProvider>
                    </ApplicationEventsProvider>
                </AuthProvider>
            </QueryClientProvider>
        </ChakraProvider>
    </React.StrictMode>,
);
