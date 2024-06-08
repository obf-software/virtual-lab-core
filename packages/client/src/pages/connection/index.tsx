import React from 'react';
import { Box, Center, Fade, Spinner, Stack, Text, ToastId, useToast } from '@chakra-ui/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ConnectionState, useConnection } from '../../hooks/use-connection';
import { ConnectionPageNavbar } from './navbar';

const connectionStateText: Record<ConnectionState, string> = {
    [ConnectionState.IDDLE]: 'Aguardando conexão',
    [ConnectionState.CONNECTING]: 'Conectando',
    [ConnectionState.WAITING]: 'Aguardando resposta do servidor',
    [ConnectionState.CONNECTED]: 'Conexão estabelecida',
    [ConnectionState.DISCONNECTING]: 'Desconectando do servidor',
    [ConnectionState.DISCONNECTED]: 'Desconectado do servidor',
};

export const ConnectionPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const connectionString = searchParams.get('connectionString');
    const [counter, setCounter] = React.useState<number>(5);
    const { display, state, errorMessage } = useConnection({
        connectionString,
    });
    const [statusText, setStatusText] = React.useState<string>(
        connectionStateText[ConnectionState.IDDLE],
    );
    const toast = useToast();

    //On mobile, if the orientation is not landscape, display a message to the user
    React.useEffect(() => {
        let toastId: ToastId | undefined;

        if (
            window.screen.orientation.type !== 'landscape-primary' &&
            window.screen.orientation.type !== 'landscape-secondary'
        ) {
            toastId = toast({
                title: 'Orientação incorreta',
                description: 'Por favor, gire o dispositivo para a orientação paisagem.',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
        }

        return () => {
            if (toastId) {
                toast.close(toastId);
            }
        };
    }, [window.screen.orientation.type]);

    /**
     * Get state set when navigating to the connection page
     */
    const pageState = useLocation().state as
        | { instanceName: string | undefined }
        | null
        | undefined;

    //When the screen size changes, adjust the display size
    React.useEffect(() => {
        const handleResize = () => {
            if (display) {
                display.scale((window.innerHeight - 60) / display.getHeight());
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [display]);

    /**
     * Update the status text and redirect to the instances page if the connection is lost.
     */
    React.useEffect(() => {
        let timeout: NodeJS.Timeout | undefined;

        if (state === 'DISCONNECTED') {
            timeout = setTimeout(() => {
                navigate('/instances');
            }, 3000);
        }

        setStatusText(connectionStateText[state]);

        return () => {
            clearTimeout(timeout);
        };
    }, [state]);

    /**
     * Redirect to the home page if no connection string is found.
     */
    React.useEffect(() => {
        let timeout: NodeJS.Timeout | undefined;
        let interval: NodeJS.Timeout | undefined;

        if (!connectionString || pageState?.instanceName === undefined) {
            timeout = setTimeout(() => {
                navigate('/instances');
            }, 5000);

            interval = setInterval(() => {
                setCounter((prev) => prev - 1);
            }, 1000);

            console.log('Invalid page access, redirecting in 5 seconds.');
        }

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [connectionString, pageState]);

    /**
     * Show a toast with the error message if it exists.
     */
    React.useEffect(() => {
        let toastId: string | number | undefined;
        if (errorMessage) {
            toastId = toast({
                title: 'Erro de conexão',
                description: `${errorMessage}`,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }

        return () => {
            if (toastId) {
                toast.close(toastId);
            }
        };
    }, [errorMessage]);

    return (
        <Box
            bg={'gray.100'}
            h={'100vh'}
            w={'100%'}
            overflow={'hidden'}
        >
            <ConnectionPageNavbar
                instanceName={pageState?.instanceName}
                onDisconnect={() => {
                    navigate('/instances');
                }}
            />
            <Center h={'calc(100vh - 60px)'}>
                {!connectionString ? (
                    <Stack
                        direction={'column'}
                        spacing={4}
                        alignItems={'center'}
                    >
                        <Spinner
                            size={'xl'}
                            thickness={'4px'}
                            speed={'0.65s'}
                            emptyColor={'gray.200'}
                            color={'blue.500'}
                        />

                        <Text
                            fontSize={'xl'}
                            fontWeight={'semibold'}
                        >
                            Ops! Parece que você acessou essa página de forma incorreta.
                        </Text>

                        <Text
                            fontSize={'md'}
                            fontWeight={'normal'}
                        >
                            Você será redirecionado em {counter} segundos.
                        </Text>
                    </Stack>
                ) : (
                    <Box>
                        <Stack
                            hidden={state === ConnectionState.CONNECTED}
                            direction={'column'}
                            spacing={4}
                            alignItems={'center'}
                        >
                            <Spinner
                                size={'xl'}
                                thickness={'4px'}
                                speed={'0.65s'}
                                emptyColor={'gray.200'}
                                color={'blue.500'}
                            />
                            <Text
                                fontSize={'xl'}
                                fontWeight={'semibold'}
                            >
                                {statusText}
                            </Text>
                        </Stack>

                        <Fade
                            in={state === ConnectionState.CONNECTED}
                            transition={{
                                enter: { duration: 1 },
                                exit: { duration: 1 },
                            }}
                        >
                            <Box
                                w={'100%'}
                                hidden={state !== ConnectionState.CONNECTED}
                                ref={(ref) =>
                                    ref?.replaceChildren(
                                        display?.getElement() ?? (null as unknown as Node),
                                    )
                                }
                            />
                        </Fade>
                    </Box>
                )}
            </Center>
        </Box>
    );
};
