import { useAuthenticator } from '@aws-amplify/ui-react';
import {
    Avatar,
    Box,
    Flex,
    FlexProps,
    HStack,
    IconButton,
    Menu,
    MenuButton,
    MenuDivider,
    MenuItem,
    MenuList,
    Text,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiSettings, FiUser } from 'react-icons/fi';

interface NavbarProps extends FlexProps {
    onOpen: () => void;
}

/**
 * Colocar o use authenticator pra pegar as infos do usuário
 */
export const Navbar: React.FC<NavbarProps> = ({ onOpen, ...rest }) => {
    const { user, signOut } = useAuthenticator((context) => [context.user]);

    const attributes = user?.attributes as Partial<{
        email: string;
        name: string;
        profile: string;
        role: string;
    }>;

    const name = attributes.name || attributes.email || user.username || 'Usuário';
    const role = attributes.role || 'Usuário';
    const profileImageUrl = attributes.profile;

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
                onClick={onOpen}
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

            <HStack spacing={{ base: '0', md: '6' }}>
                <IconButton
                    size='lg'
                    variant='ghost'
                    aria-label='open menu'
                    icon={<FiBell />}
                />
                <Flex alignItems={'center'}>
                    <Menu>
                        <MenuButton
                            py={2}
                            transition='all 0.3s'
                            _focus={{ boxShadow: 'none' }}
                        >
                            <HStack>
                                <Avatar
                                    size={'sm'}
                                    src={profileImageUrl}
                                />
                                <VStack
                                    display={{ base: 'none', md: 'flex' }}
                                    alignItems='flex-start'
                                    spacing='1px'
                                    ml='2'
                                >
                                    <Text fontSize='sm'>{name}</Text>
                                    <Text
                                        fontSize='xs'
                                        color='gray.600'
                                    >
                                        {role}
                                    </Text>
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
                            <MenuItem icon={<FiUser />}>Perfil</MenuItem>
                            <MenuItem icon={<FiSettings />}>Configurações</MenuItem>
                            <MenuDivider />
                            <MenuItem
                                icon={<FiLogOut />}
                                onClick={signOut}
                                textColor={'red.400'}
                            >
                                Sair
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </Flex>
            </HStack>
        </Flex>
    );
};
