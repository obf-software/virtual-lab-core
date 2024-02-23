import {
    Badge,
    Box,
    ButtonGroup,
    IconButton,
    Menu,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverFooter,
    PopoverHeader,
    PopoverTrigger,
    Stack,
    Text,
    Tooltip,
    keyframes,
    useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { PulsingDot } from '../../../../components/pulsing-dot';
import { BiSolidBellRing } from 'react-icons/bi';
import { FiBell, FiEye, FiPaperclip } from 'react-icons/fi';
import { useApplicationEventsContext } from '../../../../contexts/application-events/hook';
import { v4 } from 'uuid';
import { instanceStateToDisplayString } from '../../../../services/helpers';

interface Notification {
    id: string;
    text: string;
    viewed: boolean;
}

export const NavbarNotificationsButton: React.FC = () => {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const { registerHandler, unregisterHandlerById } = useApplicationEventsContext();

    const addNotification = React.useCallback(
        (text: string): string => {
            const id = v4();

            setNotifications((prevNotifications) => [
                ...prevNotifications,
                { id, text, viewed: false },
            ]);

            return id;
        },
        [setNotifications, notifications],
    );

    const markNotificationAsViewed = React.useCallback(
        (id: string) => {
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                    notification.id === id ? { ...notification, viewed: true } : notification,
                ),
            );
        },
        [setNotifications, notifications],
    );

    const markAllNotificationsAsViewed = React.useCallback(() => {
        setNotifications((prevNotifications) =>
            prevNotifications.map((notification) => ({ ...notification, viewed: true })),
        );
    }, [setNotifications, notifications]);

    const numberOfUnreadNotifications = React.useMemo(
        () => notifications.filter((notification) => !notification.viewed).length,
        [notifications],
    );

    React.useEffect(() => {
        const instanceStateChangedHandlerId = registerHandler(
            'INSTANCE_STATE_CHANGED',
            (detail) => {
                addNotification(
                    `A instância "${detail.instance.name}" mudou de estado para ${instanceStateToDisplayString(detail.state)}`,
                );
            },
        );

        const instanceLaunchedHandlerId = registerHandler('INSTANCE_LAUNCHED', (detail) => {
            addNotification(`A instância ${detail.instance.name} foi configurada.`);
        });

        return () => {
            unregisterHandlerById(instanceStateChangedHandlerId);
            unregisterHandlerById(instanceLaunchedHandlerId);
        };
    }, []);

    const newNotificationAnimation = keyframes`
    0% { transform: rotate(0deg); }
    5% { transform: rotate(-20deg); }
    10% { transform: rotate(20deg); }
    15% { transform: rotate(-10deg); }
    20% { transform: rotate(0deg); }
    100% { transform: rotate(0deg); }
    `;

    return (
        <Popover
            placement='bottom-start'
            isLazy
        >
            <Box position='relative'>
                <PopoverTrigger>
                    <IconButton
                        animation={`${newNotificationAnimation} 2s ${numberOfUnreadNotifications > 0 ? 'infinite' : 'none'} 1s`}
                        rounded={'full'}
                        size='lg'
                        variant='ghost'
                        aria-label='Mostrar notificações'
                        color={'blue.400'}
                        icon={
                            notifications.some((notification) => notification.viewed === false) ? (
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
                        justifyContent={'center'}
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

                <PopoverHeader>
                    <Text fontWeight={'bold'}>Notificações</Text>
                </PopoverHeader>

                <PopoverBody
                    maxH={'50vh'}
                    overflowY={'auto'}
                >
                    {notifications.length === 0 && (
                        <Text
                            color={'gray.500'}
                            textAlign={'center'}
                            marginY={4}
                        >
                            Nenhuma notificação
                        </Text>
                    )}

                    <Menu>
                        {notifications.map((notification, index) => (
                            <Box
                                key={notification.id}
                                onClick={() => markNotificationAsViewed(notification.id)}
                                _hover={{
                                    cursor: notification.viewed ? 'default' : 'pointer',
                                    bg: useColorModeValue('gray.100', 'gray.700'),
                                }}
                                py={6}
                                px={2}
                                borderBottom={index === notifications.length - 1 ? 'none' : '1px'}
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
                                        bgColor={notification.viewed ? 'gray.200' : 'green.400'}
                                        animated={!notification.viewed}
                                    />
                                </Stack>
                            </Box>
                        ))}
                    </Menu>
                </PopoverBody>

                {notifications.length > 0 && (
                    <PopoverFooter
                        display={'flex'}
                        justifyContent={'space-between'}
                        alignItems={'center'}
                    >
                        <Text
                            fontSize={'sm'}
                            color={'gray.500'}
                            fontWeight={'normal'}
                        >
                            {numberOfUnreadNotifications === 0 &&
                                'Todas as notificações foram lidas.'}
                            {numberOfUnreadNotifications === 1 && '1 não lida'}
                            {numberOfUnreadNotifications > 1 &&
                                `${numberOfUnreadNotifications} não lidas`}
                        </Text>
                        <ButtonGroup>
                            <Tooltip label={'Marcar todas como lidas'}>
                                <IconButton
                                    size={'sm'}
                                    variant={'outline'}
                                    aria-label={'Marcar todas como lidas'}
                                    icon={<FiEye />}
                                    onClick={markAllNotificationsAsViewed}
                                />
                            </Tooltip>
                            <Tooltip label={'Limpar todas'}>
                                <IconButton
                                    size={'sm'}
                                    variant={'outline'}
                                    aria-label={'Limpar todas'}
                                    icon={<FiPaperclip />}
                                    onClick={() => setNotifications([])}
                                />
                            </Tooltip>
                        </ButtonGroup>
                    </PopoverFooter>
                )}
            </PopoverContent>
        </Popover>
    );
};
