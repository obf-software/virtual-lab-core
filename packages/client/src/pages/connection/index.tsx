import React from 'react';
import { Box, Center, Spinner, Stack, Text, useToast } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useConnection } from '../../hooks/use-connection';

enum ConnectionState {
    IDDLE = 'IDDLE',
    CONNECTING = 'CONNECTING',
    WAITING = 'WAITING',
    CONNECTED = 'CONNECTED',
    DISCONNECTING = 'DISCONNECTING',
    DISCONNECTED = 'DISCONNECTED',
}

const connectionStateText: Record<ConnectionState, string> = {
    [ConnectionState.IDDLE]: 'Aguardando conexão',
    [ConnectionState.CONNECTING]: 'Conectando',
    [ConnectionState.WAITING]: 'Conectando',
    [ConnectionState.CONNECTED]: 'Conexão estabelecida',
    [ConnectionState.DISCONNECTING]: 'Desconectando do servidor',
    [ConnectionState.DISCONNECTED]: 'Desconectado do servidor',
};

export const ConnectionPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const connectionString = searchParams.get('connectionString');
    const [counter, setCounter] = React.useState<number>(5);
    const [statusText, setStatusText] = React.useState<string>(
        connectionStateText[ConnectionState.IDDLE],
    );
    const toast = useToast();

    React.useEffect(() => {
        let timeout: NodeJS.Timeout;
        let interval: NodeJS.Timeout;
        if (!connectionString) {
            timeout = setTimeout(() => {
                navigate('/');
            }, 5000);

            interval = setInterval(() => {
                setCounter((prev) => prev - 1);
            }, 1000);
        }

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [connectionString]);

    if (!connectionString) {
        return (
            <Center height={'100vh'}>
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
                        Nenhuma conexão encontrada. Por favor, verifique o link e tente novamente.
                    </Text>

                    <Text
                        fontSize={'md'}
                        fontWeight={'normal'}
                    >
                        Você será redirecionado em {counter} segundos.
                    </Text>
                </Stack>
            </Center>
        );
    }

    const { display, state, bindControls, errorMessage } = useConnection({ connectionString });

    display.onresize = (_width, height) => {
        display.scale(window.innerHeight / height);
    };

    React.useEffect(() => {
        const { unbindControls } = bindControls();

        return () => {
            unbindControls();
        };
    }, []);

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

    React.useEffect(() => {
        if (state === 'DISCONNECTED') {
            setTimeout(() => {
                navigate('/instances');
            }, 3000);
        }
        setStatusText(connectionStateText[state]);
    }, [state]);

    // const displayHeight = display.getHeight();

    // React.useEffect(() => {
    //     console.log(displayHeight);
    //     if (display.getHeight() === 0) {
    //         return;
    //     }

    //     display.scale(window.innerHeight / displayHeight);
    //     console.log(display.getScale());
    // }, [displayHeight]);

    // // Scale display to fit the screen Height
    // console.log(window.innerHeight);
    // console.log(display.getHeight());

    // display.scale(window.innerHeight / display.getHeight());

    // console.log(display.getScale());

    return (
        <Center h={'100vh'}>
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

            <Box
                hidden={state !== ConnectionState.CONNECTED}
                w={'100%'}
                h={'100vh'}
                justifyContent={'center'}
                alignItems={'center'}
                display={'flex'}
                ref={(ref) => {
                    ref?.replaceChildren(display.getElement());
                }}
            />
        </Center>
    );
};
