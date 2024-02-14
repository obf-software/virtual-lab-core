import { Flex, FlexProps, HStack, IconButton, Text, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import { FiMenu } from 'react-icons/fi';
import { NavbarNotificationsButton } from './notifications-button';
import { NavbarMenu } from './menu';

interface NavbarProps extends FlexProps {
    onOpenSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar, ...rest }) => {
    return (
        <Flex
            ml={{ base: 0, md: 60 }}
            px={{ base: 4, md: 4 }}
            height='20'
            alignItems='center'
            bg={useColorModeValue('white', 'gray.900')}
            borderBottomWidth='1px'
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            justifyContent={{ base: 'space-between', md: 'flex-end' }}
            {...rest}
        >
            <IconButton
                display={{ base: 'flex', md: 'none' }}
                onClick={onOpenSidebar}
                variant='outline'
                aria-label='open menu'
                icon={<FiMenu />}
            />

            <Text
                display={{ base: 'flex', md: 'none' }}
                fontSize='2xl'
                fontFamily='monospace'
                fontWeight='bold'
            >
                Virtual Lab
            </Text>

            <HStack spacing={{ base: '4', md: '6' }}>
                <NavbarNotificationsButton />
                <NavbarMenu />
            </HStack>
        </Flex>
    );
};
