'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/components/auth-provider';
import { MenuProvider } from '@/contexts/menu';
import { theme } from './theme';
import { PropsWithChildren } from 'react';

interface ProvidersProps {
    styles?: string;
}

export const Providers: React.FC<PropsWithChildren<ProvidersProps>> = ({ children, styles }) => {
    return (
        <>
            <style
                jsx
                global
            >
                {styles}
            </style>
            <CacheProvider>
                <ChakraProvider theme={theme}>
                    <AuthProvider>
                        <MenuProvider>{children}</MenuProvider>
                    </AuthProvider>
                </ChakraProvider>
            </CacheProvider>
        </>
    );
};
