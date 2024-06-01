import React from 'react';
import { Box, Center, Spinner, Stack, Text, useToast } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConnectionState, useConnection } from '../../hooks/use-connection';

const connectionStateText: Record<ConnectionState, string> = {
    [ConnectionState.IDDLE]: 'Aguardando conexão',
    [ConnectionState.CONNECTING]: 'Conectando',
    [ConnectionState.WAITING]: 'Esperando resposta do servidor',
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

    /**
     * Update the status text.
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

        if (!connectionString) {
            timeout = setTimeout(() => {
                navigate('/');
            }, 5000);

            interval = setInterval(() => {
                setCounter((prev) => prev - 1);
            }, 1000);

            console.log('No connection string found, redirecting in 5 seconds.');
        }

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [connectionString]);

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
        <Center h={'100vh'}>
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
                        Nenhuma conexão encontrada. Por favor, verifique o link e tente novamente.
                    </Text>

                    <Text
                        fontSize={'md'}
                        fontWeight={'normal'}
                    >
                        Você será redirecionado em {counter} segundos.
                    </Text>
                </Stack>
            ) : (
                <>
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
                        ref={(ref) =>
                            ref?.replaceChildren(display?.getElement() ?? (null as unknown as Node))
                        }
                    />
                </>
            )}
        </Center>
    );
};
