import React, { PropsWithChildren, useEffect, useState } from 'react';
import { ConnectionContext } from './context';
import Guacamole from 'guacamole-client';
import { ConnectionState } from './protocol';
import { Box, useToast } from '@chakra-ui/react';

export const ConnectionProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [connectionState, setConnectionState] = useState<keyof typeof ConnectionState>('IDDLE');
    const [client, setClient] = useState<Guacamole.Client>();
    const [element, setElement] = useState<JSX.Element>();
    const [lastSync, setLastSync] = useState<number>();
    const [keyboard, setKeyboard] = useState<Guacamole.Keyboard>();
    const [mouse, setMouse] = useState<Guacamole.Mouse>();
    const toast = useToast();

    useEffect(() => {
        const tunnel = new Guacamole.WebSocketTunnel('ws://localhost:8080/');
        const newClient = new Guacamole.Client(tunnel);

        newClient.onerror = (error) => {
            toast({
                title: 'Erro de conexão',
                description: error.message,
                status: 'error',
                duration: 9000,
                isClosable: true,
                variant: 'left-accent',
            });
        };

        newClient.onstatechange = (state) => {
            const stateMap: Record<number, ConnectionState | undefined> = {
                0: ConnectionState.IDDLE,
                1: ConnectionState.CONNECTING,
                2: ConnectionState.WAITING,
                3: ConnectionState.CONNECTED,
                4: ConnectionState.DISCONNECTING,
                5: ConnectionState.DISCONNECTED,
            };
            const newState = stateMap[state];
            if (newState !== undefined) {
                setConnectionState(newState);

                const displayMap: Record<
                    keyof typeof ConnectionState,
                    {
                        title: string;
                        description?: string;
                        status: 'error' | 'info' | 'warning' | 'success' | 'loading' | undefined;
                    }
                > = {
                    IDDLE: {
                        title: 'Conexão inativa',
                        description: 'Selecione uma instância para iniciar uma conexão',
                        status: 'info',
                    },
                    CONNECTING: {
                        title: 'Conectando com o servidor',
                        description: 'Aguarde...',
                        status: 'loading',
                    },
                    WAITING: {
                        title: 'Aguardando resposta do servidor',
                        description: 'Aguarde...',
                        status: 'loading',
                    },
                    CONNECTED: {
                        title: 'Conectado com o servidor',
                        description: 'Você já pode interagir com a instância',
                        status: 'success',
                    },
                    DISCONNECTING: {
                        title: 'Desconectando do servidor',
                        description: 'Aguarde enquanto a conexão é encerrada',
                        status: 'loading',
                    },
                    DISCONNECTED: {
                        title: 'Conexão com o servidor encerrada',
                        status: 'warning',
                    },
                };

                if (toast.isActive('connectionState')) {
                    toast.update('connectionState', {
                        title: displayMap[newState].title,
                        description: displayMap[newState].description,
                        status: displayMap[newState].status,
                        position: 'top',
                        variant: 'left-accent',
                        duration: 3000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: displayMap[newState].title,
                        description: displayMap[newState].description,
                        status: displayMap[newState].status,
                        position: 'top',
                        variant: 'left-accent',
                        duration: 3000,
                        isClosable: true,
                        id: 'connectionState',
                    });
                }
            }
        };

        newClient.onsync = (timestamp) => {
            setLastSync(timestamp);
        };

        const element = newClient.getDisplay().getElement();

        setClient(newClient);
        setElement(
            <Box
                bgColor={'black'}
                w={'100%'}
                h={'100vh'}
                justifyContent={'center'}
                alignItems={'center'}
                display={'flex'}
                ref={(ref) => {
                    element ? ref?.appendChild(element) : null;
                }}
            />,
        );
        setKeyboard(new Guacamole.Keyboard(document));
        setMouse(new Guacamole.Mouse(element));

        return () => {
            setClient(undefined);
            setElement(undefined);
            setLastSync(undefined);
        };
    }, []);

    const bindControls = () => {
        console.log('BINDING CONTROLS');
        if (keyboard !== undefined) {
            keyboard.onkeydown = (keysym) => client?.sendKeyEvent(1, keysym);
            keyboard.onkeyup = (keysym) => client?.sendKeyEvent(0, keysym);
            console.log('CONNECTED keyboard');
        }
        if (mouse !== undefined) {
            mouse.onmousedown = (mouseState) => client?.sendMouseState(mouseState);
            mouse.onmouseup = (mouseState) => client?.sendMouseState(mouseState);
            mouse.onmousemove = (mouseState) => client?.sendMouseState(mouseState);
            console.log('CONNECTED mouse');
        }
    };

    const unbindControls = () => {
        console.log('UNBINDING CONTROLS');
        if (keyboard !== undefined) {
            keyboard.onkeydown = null;
            keyboard.onkeyup = null;
            console.log('DISCONNECTED keyboard');
        }
        if (mouse !== undefined) {
            mouse.onmousedown = null;
            mouse.onmouseup = null;
            mouse.onmousemove = null;
            console.log('DISCONNECTED mouse');
        }
    };

    const connect = (token: string) => {
        if (client === undefined) {
            toast({
                title: 'Client is undefined',
                description: 'something went wrong',
                status: 'error',
                duration: 9000,
                isClosable: true,
            });
            return false;
        }

        client.connect(token);
        return true;
    };

    const disconnect = () => {
        if (client === undefined) {
            return;
        }

        client.disconnect();
    };

    return (
        <ConnectionContext.Provider
            value={{
                connect,
                disconnect,
                bindControls,
                unbindControls,
                element,
                connectionState,
                lastSync,
            }}
        >
            {children}
        </ConnectionContext.Provider>
    );
};
