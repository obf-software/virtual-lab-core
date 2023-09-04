'use client';

import { Box, useColorModeValue, Drawer, DrawerContent, useDisclosure } from '@chakra-ui/react';
import React, { PropsWithChildren } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

export const MainLayout: React.FC<PropsWithChildren> = ({ children }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <Box
            minH='100vh'
            bg={useColorModeValue('gray.100', 'gray.900')}
        >
            <Sidebar
                onClose={() => onClose}
                display={{ base: 'none', md: 'block' }}
            />
            <Drawer
                isOpen={isOpen}
                placement='left'
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size='full'
            >
                <DrawerContent>
                    <Sidebar onClose={onClose} />
                </DrawerContent>
            </Drawer>

            <Navbar onOpen={onOpen} />

            <Box
                ml={{ base: 0, md: 60 }}
                p={4}
            >
                {children}
            </Box>
        </Box>
    );
};
