import React, { PropsWithChildren, useState } from 'react';
import { ConnectionContext } from './context';
import Guacamole from 'guacamole-client';
import { ConnectionState, stateMap } from './protocol';
import { Box, useToast } from '@chakra-ui/react';

export const ConnectionProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [connectionState, setConnectionState] = useState<keyof typeof ConnectionState>('IDDLE');
    const [client, setClient] = useState<Guacamole.Client>();
    const [element, setElement] = useState<JSX.Element>();
    const [lastSync, setLastSync] = useState<number>();
    const [keyboard, setKeyboard] = useState<Guacamole.Keyboard>();
    const [mouse, setMouse] = useState<Guacamole.Mouse>();
    const toast = useToast();

    const reset = () => {
        setConnectionState('IDDLE');

        if (client !== undefined) {
            client.onerror = null;
            client.onstatechange = null;
            client.onsync = null;
            client.disconnect();
            setClient(undefined);
        }

        setElement(undefined);
        setLastSync(undefined);

        if (keyboard !== undefined) {
            keyboard.onkeydown = null;
            keyboard.onkeyup = null;
            setKeyboard(undefined);
        }

        if (mouse !== undefined) {
            mouse.onmousedown = null;
            mouse.onmouseup = null;
            mouse.onmousemove = null;
            setMouse(undefined);
        }
    };

    const connect = (connectionString: string) => {
        reset();

        const tunnel = new Guacamole.WebSocketTunnel('ws://localhost:8080/');
        const newClient = new Guacamole.Client(tunnel);

        newClient.onerror = (error) => {
            toast({
                title: 'A conexão não pode ser estabelecida',
                description:
                    'A instância está sendo preparada, tente novamente em alguns instantes.',
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
                variant: 'left-accent',
            });
            console.error(error);
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

            if (newState.state === 'DISCONNECTED') {
                reset();
            }
        };

        newClient.onsync = (timestamp) => {
            setLastSync(timestamp);
        };

        const element = newClient.getDisplay().getElement();
        setElement(
            <Box
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

        const newKeyboard = new Guacamole.Keyboard(document);
        newKeyboard.onkeydown = (keysym) => newClient.sendKeyEvent(1, keysym);
        newKeyboard.onkeyup = (keysym) => newClient.sendKeyEvent(0, keysym);
        setKeyboard(newKeyboard);

        const newMouse = new Guacamole.Mouse(element);
        newMouse.onmousedown = (mouseState) => newClient.sendMouseState(mouseState);
        newMouse.onmouseup = (mouseState) => newClient.sendMouseState(mouseState);
        newMouse.onmousemove = (mouseState) => newClient.sendMouseState(mouseState);
        setMouse(newMouse);

        newClient.connect(connectionString);
        setClient(newClient);
    };

    const disconnect = () => {
        client?.disconnect();
    };

    return (
        <ConnectionContext.Provider
            value={{
                connect,
                disconnect,
                reset,
                element,
                connectionState,
                lastSync,
            }}
        >
            {children}
        </ConnectionContext.Provider>
    );
};
