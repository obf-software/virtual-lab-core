import { useAuthenticator } from '@aws-amplify/ui-react';
import {
    Avatar,
    Box,
    HStack,
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuList,
    SkeletonText,
    Text,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { FiChevronDown, FiLogOut, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuthSessionData } from '../../../../hooks/use-auth-session-data';
import { queryClient } from '../../../../services/query-client';

export const NavbarMenu: React.FC = () => {
    const { signOut } = useAuthenticator((context) => [context.user]);
    const { authSessionData } = useAuthSessionData();

    return (
        <Menu>
            <MenuButton
                py={2}
                transition='all 0.3s'
                _focus={{ boxShadow: 'none' }}
            >
                <HStack>
                    <Avatar
                        backgroundColor={'blue.900'}
                        borderColor={'blue.600'}
                        textColor={'white'}
                        borderWidth={2}
                        name={authSessionData?.displayName}
                        size={'sm'}
                        src={authSessionData?.picture}
                    />
                    <VStack
                        display={{ base: 'none', md: 'flex' }}
                        alignItems='flex-start'
                        spacing='1px'
                        ml='2'
                    >
                        {authSessionData === undefined ? (
                            <>
                                <SkeletonText
                                    noOfLines={2}
                                    w='100px'
                                />
                            </>
                        ) : (
                            <>
                                <Text fontSize='sm'>
                                    {(authSessionData?.displayName ?? '').length <= 30
                                        ? authSessionData?.displayName
                                        : `${authSessionData?.displayName.slice(0, 30)}...`}
                                </Text>
                                <Text
                                    fontSize='xs'
                                    color='gray.600'
                                >
                                    {authSessionData?.displayRole}
                                </Text>
                            </>
                        )}
                    </VStack>
                    <Box display={{ base: 'none', md: 'flex' }}>
                        <FiChevronDown />
                    </Box>
                </HStack>
            </MenuButton>
            <MenuList
                bg={useColorModeValue('white', 'gray.900')}
                borderColor={useColorModeValue('gray.200', 'gray.700')}
            >
                <Link to='/profile'>
                    <MenuItem icon={<FiUser />}>Perfil</MenuItem>
                </Link>
                <MenuDivider />
                <MenuItem
                    icon={<FiLogOut />}
                    onClick={() => {
                        queryClient.clear();
                        signOut();
                    }}
                    textColor={'red.400'}
                >
                    Sair
                </MenuItem>
            </MenuList>
        </Menu>
    );
};
