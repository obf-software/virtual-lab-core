import {
    Badge,
    Box,
    BoxProps,
    CloseButton,
    Flex,
    Icon,
    Text,
    useColorModeValue,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useMenuContext } from '../../../contexts/menu/hook';
import { menuItemsMap } from '../../../contexts/menu/protocol';
import React from 'react';
import { useAuthSessionData } from '../../../hooks/use-auth-session-data';

interface SidebarProps extends BoxProps {
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose, ...rest }) => {
    const { getActiveMenuItem, setActiveMenuItem } = useMenuContext();
    const authSessionData = useAuthSessionData();

    const menuItems = [...Object.entries(menuItemsMap)];

    const activeIndex = menuItems.findIndex(([id]) => id === getActiveMenuItem()?.id);

    return (
        <Box
            transition='3s ease'
            bg={useColorModeValue('white', 'gray.900')}
            borderRight='1px'
            borderRightColor={useColorModeValue('gray.200', 'gray.700')}
            w={{ base: 'full', md: 60 }}
            pos='fixed'
            h='full'
            {...rest}
        >
            <Flex
                h='20'
                alignItems='center'
                mx='8'
                justifyContent='space-between'
            >
                <Text
                    fontSize='2xl'
                    fontFamily='monospace'
                    fontWeight='bold'
                >
                    Virtual Lab
                </Text>

                <CloseButton
                    display={{ base: 'flex', md: 'none' }}
                    onClick={onClose}
                />
            </Flex>

            {menuItems
                .filter(([, item]) => (authSessionData?.role === 'ADMIN' ? true : !item.adminOnly))
                .map(([id, item], index) => (
                    <Link
                        key={`nav-item-${item.label}`}
                        to={item.href}
                        style={{ textDecoration: 'none' }}
                        // _focus={{ boxShadow: 'none' }}
                        onClick={() => {
                            setActiveMenuItem(id as keyof typeof menuItemsMap);
                        }}
                    >
                        <Flex
                            align='center'
                            p='4'
                            mx='4'
                            borderRadius='lg'
                            role='group'
                            cursor='pointer'
                            _hover={{
                                bg: 'blue.400',
                                color: 'white',
                            }}
                            color={activeIndex === index ? 'blue.400' : undefined}
                        >
                            <Icon
                                mr='4'
                                fontSize='16'
                                _groupHover={{
                                    color: 'white',
                                }}
                                as={item.icon}
                            />

                            <Text>{item.label}</Text>

                            {item.adminOnly && (
                                <Badge
                                    ml='4'
                                    colorScheme='blue'
                                    variant={'solid'}
                                    _groupHover={{
                                        colorScheme: 'whiteAlpha',
                                        color: 'blue.500',
                                        bgColor: 'white',
                                    }}
                                >
                                    ADM
                                </Badge>
                            )}
                        </Flex>
                    </Link>
                ))}
        </Box>
    );
};
