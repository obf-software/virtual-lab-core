import React from 'react';
import Guacamole from 'guacamole-client';

enum ConnectionState {
    IDDLE = 'IDDLE',
    CONNECTING = 'CONNECTING',
    WAITING = 'WAITING',
    CONNECTED = 'CONNECTED',
    DISCONNECTING = 'DISCONNECTING',
    DISCONNECTED = 'DISCONNECTED',
}

export const useConnection = (props: { connectionString: string }) => {
    const [state, setState] = React.useState<keyof typeof ConnectionState>('IDDLE');

    const tunnel = React.useMemo(() => {
        const newTunnel = new Guacamole.WebSocketTunnel('ws://localhost:8080/'); // TODO: Get this from the environment
        newTunnel.onerror = (error) => {
            console.log(error);
        };
        return newTunnel;
    }, []);

    const client = React.useMemo(() => {
        const newClient = new Guacamole.Client(tunnel);

        newClient.onerror = (error) => {
            console.log(error);
        };

        newClient.onstatechange = (state) => {
            const stateMap: Record<number, keyof typeof ConnectionState> = {
                0: 'IDDLE',
                1: 'CONNECTING',
                2: 'WAITING',
                3: 'CONNECTED',
                4: 'DISCONNECTING',
                5: 'DISCONNECTED',
            };

            const newState = stateMap[state];

            if (newState === undefined) {
                console.log('Unknown state', state);
                return;
            }

            setState(newState);
        };

        newClient.connect(props.connectionString);

        return newClient;
    }, [tunnel, props.connectionString]);

    const display = React.useMemo(() => {
        const newDisplay = client.getDisplay();
        return newDisplay;
    }, [client]);

    const bindControls = () => {
        const newKeyboard = new Guacamole.Keyboard(document);
        newKeyboard.onkeydown = (keysym) => client.sendKeyEvent(1, keysym);
        newKeyboard.onkeyup = (keysym) => client.sendKeyEvent(0, keysym);

        const newMouse = new Guacamole.Mouse(display.getElement());

        const adjustScale = (mouseState: Guacamole.Mouse.State) =>
            new Guacamole.Mouse.State(
                mouseState.x / display.getScale(),
                mouseState.y / display.getScale(),
                mouseState.left,
                mouseState.middle,
                mouseState.right,
                mouseState.up,
                mouseState.down,
            );

        newMouse.onmousedown = (mouseState) => client.sendMouseState(adjustScale(mouseState));
        newMouse.onmouseup = (mouseState) => client.sendMouseState(adjustScale(mouseState));
        newMouse.onmousemove = (mouseState) => client.sendMouseState(adjustScale(mouseState));

        return {
            mouse: newMouse,
            keyboard: newKeyboard,
            unbindControls: () => {
                newKeyboard.onkeydown = null;
                newKeyboard.onkeyup = null;
                newMouse.onmousedown = null;
                newMouse.onmouseup = null;
                newMouse.onmousemove = null;
            },
        };
    };

    return {
        state,
        client,
        display,
        bindControls,
    };
};

// import { UseToastOptions } from '@chakra-ui/react';

// export enum ConnectionState {
//     IDDLE = 'IDDLE',
//     CONNECTING = 'CONNECTING',
//     WAITING = 'WAITING',
//     CONNECTED = 'CONNECTED',
//     DISCONNECTING = 'DISCONNECTING',
//     DISCONNECTED = 'DISCONNECTED',
// }

// export const stateMap: Record<
//     number,
//     { toast?: Omit<UseToastOptions, 'id'>; state: keyof typeof ConnectionState } | undefined
// > = {
//     0: { state: 'IDDLE' },
//     1: {
//         state: 'CONNECTING',
//         toast: {
//             title: 'Conectando com o servidor',
//             description: 'Aguarde...',
//             status: 'loading',
//             variant: 'left-accent',
//             position: 'bottom-left',
//         },
//     },
//     2: {
//         state: 'WAITING',
//         toast: {
//             title: 'Aguardando resposta do servidor',
//             description: 'Aguarde...',
//             status: 'loading',
//             variant: 'left-accent',
//             position: 'bottom-left',
//         },
//     },
//     3: {
//         state: 'CONNECTED',
//         toast: {
//             title: 'Conexão com o servidor estabelecida',
//             description: 'Instância iniciada com sucesso!',
//             status: 'success',
//             variant: 'left-accent',
//             position: 'bottom-left',
//         },
//     },
//     4: {
//         state: 'DISCONNECTING',
//         toast: {
//             title: 'Desconectando do servidor',
//             description: 'Aguarde enquanto a conexão é encerrada',
//             status: 'loading',
//             variant: 'left-accent',
//             position: 'bottom-left',
//         },
//     },
//     5: {
//         state: 'DISCONNECTED',
//         toast: {
//             title: 'Conexão com o servidor encerrada',
//             status: 'info',
//             variant: 'left-accent',
//             position: 'bottom-left',
//         },
//     },
// };

// export interface ConnectionContextData {
//     connect: (connectionString: string) => void;
//     disconnect: () => void;
//     reset: () => void;
//     element?: JSX.Element;
//     connectionState: keyof typeof ConnectionState;
//     lastSync?: number;
// }
