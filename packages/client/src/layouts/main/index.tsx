import { Box, Drawer, DrawerContent, useColorModeValue, useDisclosure } from '@chakra-ui/react';

import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import React from 'react';

export const MainLayout: React.FC = () => {
    const sidebarDisclosure = useDisclosure();

    return (
        <Box
            minH='100vh'
            bg={useColorModeValue('gray.100', 'gray.900')}
        >
            <Sidebar
                onClose={() => sidebarDisclosure.onClose}
                display={{ base: 'none', md: 'block' }}
            />
            <Drawer
                isOpen={sidebarDisclosure.isOpen}
                placement='left'
                onClose={sidebarDisclosure.onClose}
                returnFocusOnClose={false}
                onOverlayClick={sidebarDisclosure.onClose}
                size='full'
            >
                <DrawerContent>
                    <Sidebar onClose={sidebarDisclosure.onClose} />
                </DrawerContent>
            </Drawer>

            <Navbar onOpenSidebar={sidebarDisclosure.onOpen} />

            <Box
                ml={{ base: 0, md: 60 }}
                p={4}
            >
                <Outlet />
            </Box>
        </Box>
    );
};
