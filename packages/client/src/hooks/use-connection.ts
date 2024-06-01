import React from 'react';
import Guacamole from 'guacamole-client';

export enum ConnectionState {
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
    0x0207: 'A instância está sendo configurada para receber conexões, tente novamente em alguns instantes', // The operation could not be performed because the upstream server does not appear to exist
    0x0208: 'The operation could not be performed because the upstream server is not available to service the request',
    0x0209: 'The session within the upstream server has ended because it conflicted with another session',
    0x020a: 'The session within the upstream server has ended because it appeared to be inactive',
    0x020b: 'The session within the upstream server has been forcibly terminated',
    0x0300: 'The operation could not be performed because bad parameters were given',
    0x0301: 'A instância está sendo configurada para receber conexões, tente novamente em alguns instantes', //'Permission was denied to perform the operation, as the user is not yet authorized (not yet logged in, for example)',
    0x0303: 'Permission was denied to perform the operation, and this permission will not be granted even if the user is authorized',
    0x0308: 'The client took too long to respond',
    0x030d: 'The client sent too much data',
    0x030f: 'The client sent data of an unsupported or unexpected type',
    0x031d: 'The operation failed because the current client is already using too many resources',
};

const stateNumberToEnumMap: Record<number, keyof typeof ConnectionState> = {
    0: 'IDDLE',
    1: 'CONNECTING',
    2: 'WAITING',
    3: 'CONNECTED',
    4: 'DISCONNECTING',
    5: 'DISCONNECTED',
};

export const useConnection = (props: { connectionString: string | null }) => {
    const [state, setState] = React.useState<keyof typeof ConnectionState>('IDDLE');
    const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);
    const [display, setDisplay] = React.useState<Guacamole.Display>();

    React.useEffect(() => {
        if (!props.connectionString) {
            return;
        }

        const onErrorCallback = (error: Guacamole.Status) => {
            setErrorMessage(statusMap[error.code] ?? 'Erro desconhecido');
        };

        const tunnel = new Guacamole.WebSocketTunnel(import.meta.env.VITE_APP_WEBSOCKET_SERVER_URL);
        tunnel.onerror = onErrorCallback;

        const newClient = new Guacamole.Client(tunnel);
        newClient.onerror = onErrorCallback;
        newClient.onstatechange = (state) => {
            setState(stateNumberToEnumMap[state] ?? 'IDDLE');
        };
        newClient.connect(props.connectionString);

        const newDisplay = newClient.getDisplay();
        newDisplay.onresize = (_width, height) => {
            newDisplay.scale(window.innerHeight / height);
        };

        const newKeyboard = new Guacamole.Keyboard(document);
        newKeyboard.onkeydown = (keysym) => newClient.sendKeyEvent(1, keysym);
        newKeyboard.onkeyup = (keysym) => newClient.sendKeyEvent(0, keysym);

        const newMouse = new Guacamole.Mouse(newDisplay.getElement());

        const adjustScale = (mouseState: Guacamole.Mouse.State) =>
            new Guacamole.Mouse.State(
                mouseState.x / newDisplay.getScale(),
                mouseState.y / newDisplay.getScale(),
                mouseState.left,
                mouseState.middle,
                mouseState.right,
                mouseState.up,
                mouseState.down,
            );

        newMouse.onmousedown = (mouseState) => newClient.sendMouseState(adjustScale(mouseState));
        newMouse.onmouseup = (mouseState) => newClient.sendMouseState(adjustScale(mouseState));
        newMouse.onmousemove = (mouseState) => newClient.sendMouseState(adjustScale(mouseState));

        setDisplay(newDisplay);

        return () => {
            newKeyboard.onkeydown = null;
            newKeyboard.onkeyup = null;

            newMouse.onmousedown = null;
            newMouse.onmouseup = null;
            newMouse.onmousemove = null;

            newDisplay.onresize = null;

            newClient.onstatechange = null;
            newClient.onerror = null;

            tunnel.onerror = null;

            newClient.disconnect();
            tunnel.disconnect();
        };
    }, []);

    return {
        display,
        state,
        errorMessage,
    };
};
