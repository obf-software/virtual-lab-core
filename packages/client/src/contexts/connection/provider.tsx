import React, { PropsWithChildren, useEffect, useState } from 'react';
import { ConnectionContext } from './context';
import Guacamole from 'guacamole-client';
import { ConnectionState, stateMap } from './protocol';
import { Box, useToast } from '@chakra-ui/react';

export const ConnectionProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [connectionState, setConnectionState] = useState<keyof typeof ConnectionState>('IDDLE');
    const [client, setClient] = useState<Guacamole.Client>();
    const [element, setElement] = useState<JSX.Element>();
    const [lastSync, setLastSync] = useState<number>();
    const [, setKeyboard] = useState<Guacamole.Keyboard>();
    const [, setMouse] = useState<Guacamole.Mouse>();
    const toast = useToast();

    const createFreshState = () => {
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
            const newState = stateMap[state];

            if (newState === undefined) {
                console.log(`Unknown state "${state}", skipping...`);
                return;
            }

            setConnectionState(newState.state);
            if (newState.toast === undefined) return;

            const toastId = 'onstatechange';
            if (toast.isActive(toastId)) {
                toast.update(toastId, newState.toast);
            } else {
                toast({ ...newState.toast, id: toastId });
            }
        };

        newClient.onsync = (timestamp) => {
            setLastSync(timestamp);
        };

        const element = newClient.getDisplay().getElement();

        setConnectionState('IDDLE');
        setClient(newClient);
        setElement(
            <Box
                bgColor={'blackAlpha.700'}
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
        setLastSync(undefined);
        setKeyboard(new Guacamole.Keyboard(document));
        setMouse(new Guacamole.Mouse(element));
    };

    useEffect(() => {
        createFreshState();

        return () => {
            setClient(undefined);
            setElement(undefined);
            setLastSync(undefined);
            setKeyboard(undefined);
            setMouse(undefined);
        };
    }, []);

    const connect = (connectionString: string) => {
        if (client === undefined) {
            console.log(`Failed to connect: client is undefined`);
            return false;
        }

        client.connect(connectionString);

        setKeyboard((currentKeyboard) => {
            if (currentKeyboard === undefined) {
                console.log(`Failed to bind keyboard`);
                return undefined;
            }

            currentKeyboard.onkeydown = (keysym) => client.sendKeyEvent(1, keysym);
            currentKeyboard.onkeyup = (keysym) => client.sendKeyEvent(0, keysym);
            return currentKeyboard;
        });

        setMouse((currentMouse) => {
            if (currentMouse === undefined) {
                console.log(`Failed to bind mouse`);
                return undefined;
            }

            currentMouse.onmousedown = (mouseState) => client.sendMouseState(mouseState);
            currentMouse.onmouseup = (mouseState) => client.sendMouseState(mouseState);
            currentMouse.onmousemove = (mouseState) => client.sendMouseState(mouseState);
            return currentMouse;
        });

        return true;
    };

    const disconnect = () => {
        if (client === undefined) {
            console.log(`Failed to disconnect: client is undefined`);
            return;
        }

        setKeyboard((currentKeyboard) => {
            if (currentKeyboard === undefined) {
                console.log(`Failed to unbind keyboard`);
                return undefined;
            }

            currentKeyboard.onkeydown = null;
            currentKeyboard.onkeyup = null;
            return currentKeyboard;
        });

        setMouse((currentMouse) => {
            if (currentMouse === undefined) {
                console.log(`Failed to unbind mouse`);
                return undefined;
            }

            currentMouse.onmousedown = null;
            currentMouse.onmouseup = null;
            currentMouse.onmousemove = null;
            return currentMouse;
        });

        client.disconnect();
        createFreshState();
    };

    return (
        <ConnectionContext.Provider
            value={{
                connect,
                disconnect,
                element,
                connectionState,
                lastSync,
            }}
        >
            {children}
        </ConnectionContext.Provider>
    );
};
