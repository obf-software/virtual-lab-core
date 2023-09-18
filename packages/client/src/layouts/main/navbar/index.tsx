import { useAuthenticator } from '@aws-amplify/ui-react';
import {
    Avatar,
    Badge,
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
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Stack,
    Text,
    VStack,
    useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiSettings, FiUser } from 'react-icons/fi';
import { BiSolidBellRing } from 'react-icons/bi';
import { Link } from 'react-router-dom';
import { parseSessionData } from '../../../services/helpers';
import { useNotificationsContext } from '../../../contexts/notifications/hook';
import { PulsingDot } from './pulsing-dot';

interface NavbarProps extends FlexProps {
    onOpen: () => void;
}

/**
 * Colocar o use authenticator pra pegar as infos do usuário
 */
export const Navbar: React.FC<NavbarProps> = ({ onOpen, ...rest }) => {
    const { user, signOut } = useAuthenticator((context) => [context.user]);
    const { displayName, displayRole } = parseSessionData(user);
    const { notifications, markNotificationAsViewed } = useNotificationsContext();

    const numberOfUnreadNotifications = notifications.filter(
        (notification) => notification.viewed === false,
    ).length;

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

            <HStack spacing={{ base: '4', md: '6' }}>
                <Popover
                    placement='bottom-start'
                    isLazy
                >
                    <Box position='relative'>
                        <PopoverTrigger>
                            <IconButton
                                rounded={'full'}
                                size='lg'
                                variant='ghost'
                                aria-label='Mostrar notificações'
                                color={'blue.400'}
                                icon={
                                    notifications.some(
                                        (notification) => notification.viewed === false,
                                    ) ? (
                                        <BiSolidBellRing />
                                    ) : (
                                        <FiBell />
                                    )
                                }
                            />
                        </PopoverTrigger>

                        {numberOfUnreadNotifications > 0 ? (
                            <Badge
                                borderRadius={'50%'}
                                variant='solid'
                                pos={'absolute'}
                                colorScheme='red'
                                bottom={'0'}
                                right={'0'}
                            >
                                {numberOfUnreadNotifications}
                            </Badge>
                        ) : null}
                    </Box>

                    <PopoverContent
                        _focus={{ boxShadown: 'none' }}
                        w={{ base: '100vw', md: 'lg' }}
                    >
                        <PopoverArrow />
                        <PopoverCloseButton size={'md'} />
                        <PopoverHeader fontWeight='bold'>Notificações</PopoverHeader>
                        <PopoverBody
                            maxH={'50vh'}
                            overflowY={'auto'}
                        >
                            {notifications.length === 0 ? <Text>Nenhuma notificação</Text> : null}

                            {notifications.map((notification) => (
                                <Box
                                    key={notification.id}
                                    onClick={() => markNotificationAsViewed(notification.id)}
                                    _hover={{
                                        cursor: 'pointer',
                                        bg: useColorModeValue('gray.100', 'gray.700'),
                                    }}
                                    py={2}
                                    px={3}
                                    borderBottom={'1px'}
                                    borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
                                >
                                    <Stack
                                        direction='row'
                                        justifyContent='space-between'
                                        alignItems='center'
                                    >
                                        <Text>{notification.text}</Text>
                                        <PulsingDot
                                            w={3}
                                            h={3}
                                            bgColor={
                                                notification.viewed ? 'transparent' : 'green.400'
                                            }
                                        />
                                    </Stack>
                                </Box>
                            ))}
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
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
                                    src={undefined}
                                />
                                <VStack
                                    display={{ base: 'none', md: 'flex' }}
                                    alignItems='flex-start'
                                    spacing='1px'
                                    ml='2'
                                >
                                    <Text fontSize='sm'>
                                        {displayName.length <= 30
                                            ? displayName
                                            : `${displayName.slice(0, 30)}...`}
                                    </Text>
                                    <Text
                                        fontSize='xs'
                                        color='gray.600'
                                    >
                                        {displayRole}
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
                            <Link to='/profile'>
                                <MenuItem icon={<FiUser />}>Perfil</MenuItem>
                            </Link>
                            <Link to='/settings'>
                                <MenuItem icon={<FiSettings />}>Configurações</MenuItem>
                            </Link>
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
