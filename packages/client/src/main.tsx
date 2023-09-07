import './styles/global.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './styles/theme';
import { MenuProvider } from './contexts/menu/provider.tsx';
import { AuthProvider } from './contexts/auth/provider.tsx';
import { Router } from './router.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ChakraProvider theme={theme}>
            <AuthProvider>
                <MenuProvider>
                    <Router />
                </MenuProvider>
            </AuthProvider>
        </ChakraProvider>
    </React.StrictMode>,
);
