'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from '@/components/auth-provider';
import { theme } from './theme';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CacheProvider>
            <ChakraProvider theme={theme}>
                <AuthProvider>{children}</AuthProvider>
            </ChakraProvider>
        </CacheProvider>
    );
}
