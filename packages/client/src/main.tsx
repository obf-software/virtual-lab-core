import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './styles/theme';
import { MenuProvider } from './contexts/menu/provider.tsx';
import { AuthProvider } from './contexts/auth/provider.tsx';
import { Router } from './router.tsx';
import { NotificationsProvider } from './contexts/notifications/provider.tsx';
import { ProductsProvider } from './contexts/products/provider.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/query/service.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <NotificationsProvider>
                        <MenuProvider>
                            <ProductsProvider>
                                <Router />
                            </ProductsProvider>
                        </MenuProvider>
                    </NotificationsProvider>
                </AuthProvider>
            </QueryClientProvider>
        </ChakraProvider>
    </React.StrictMode>,
);
