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

const statusMap: Record<Guacamole.Status.Code, string> = {
    0x0000: 'SUCCESS: 0x0000',
    0x0100: 'The requested operation is unsupported',
    0x0200: 'The operation could not be performed due to an internal failure',
    0x0201: 'The operation could not be performed as the server is busy',
    0x0202: 'The operation could not be performed because the upstream server is not responding',
    0x0203: 'The operation was unsuccessful due to an error or otherwise unexpected condition of the upstream server',
    0x0204: 'The operation could not be performed as the requested resource does not exist',
    0x0205: 'The operation could not be performed as the requested resource is already in use',
    0x0206: 'The operation could not be performed as the requested resource is now closed',
    0x0207: 'The operation could not be performed because the upstream server does not appear to exist',
    0x0208: 'The operation could not be performed because the upstream server is not available to service the request',
    0x0209: 'The session within the upstream server has ended because it conflicted with another session',
    0x020a: 'The session within the upstream server has ended because it appeared to be inactive',
    0x020b: 'The session within the upstream server has been forcibly terminated',
    0x0300: 'The operation could not be performed because bad parameters were given',
    0x0301: 'Permission was denied to perform the operation, as the user is not yet authorized (not yet logged in, for example)',
    0x0303: 'Permission was denied to perform the operation, and this permission will not be granted even if the user is authorized',
    0x0308: 'The client took too long to respond',
    0x030d: 'The client sent too much data',
    0x030f: 'The client sent data of an unsupported or unexpected type',
    0x031d: 'The operation failed because the current client is already using too many resources',
};

export const useConnection = (props: { connectionString: string }) => {
    const [state, setState] = React.useState<keyof typeof ConnectionState>('IDDLE');
    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

    const tunnel = React.useMemo(() => {
        const newTunnel = new Guacamole.WebSocketTunnel('ws://localhost:8080/'); // TODO: Get this from the environment
        newTunnel.onerror = (error) => {
            setErrorMessage(statusMap[error.code] ?? 'Erro desconhecido');
        };
        return newTunnel;
    }, []);

    const client = React.useMemo(() => {
        const newClient = new Guacamole.Client(tunnel);

        newClient.onerror = (error) => {
            setErrorMessage(statusMap[error.code] ?? 'Erro desconhecido');
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
        errorMessage,
    };
};
