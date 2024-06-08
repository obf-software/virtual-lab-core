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
    0x0000: 'SUCESSO: 0x0000',
    0x0100: 'A operação solicitada não é suportada',
    0x0200: 'A operação não pôde ser realizada devido a uma falha interna',
    0x0201: 'A operação não pôde ser realizada porque o servidor está ocupado',
    0x0202: 'A operação não pôde ser realizada porque o servidor upstream não está respondendo',
    0x0203: 'A operação não teve sucesso devido a um erro ou condição inesperada do servidor upstream',
    0x0204: 'A operação não pôde ser realizada porque o recurso solicitado não existe',
    0x0205: 'A operação não pôde ser realizada porque o recurso solicitado já está em uso',
    0x0206: 'A operação não pôde ser realizada porque o recurso solicitado agora está fechado',
    0x0207: 'A operação não pôde ser realizada porque o servidor upstream não parece existir',
    0x0208: 'A operação não pôde ser realizada porque o servidor upstream não está disponível para atender à solicitação',
    0x0209: 'A sessão dentro do servidor upstream terminou porque conflitou com outra sessão',
    0x020a: 'A sessão dentro do servidor upstream terminou porque parecia estar inativa',
    0x020b: 'A sessão dentro do servidor upstream foi terminada à força',
    0x0300: 'A operação não pôde ser realizada porque foram fornecidos parâmetros ruins',
    0x0301: 'A permissão foi negada para realizar a operação, pois o usuário ainda não está autorizado (por exemplo, ainda não fez login)',
    0x0303: 'A permissão foi negada para realizar a operação, e essa permissão não será concedida mesmo que o usuário esteja autorizado',
    0x0308: 'O cliente demorou muito para responder',
    0x030d: 'O cliente enviou muitos dados',
    0x030f: 'O cliente enviou dados de um tipo não suportado ou inesperado',
    0x031d: 'A operação falhou porque o cliente atual já está usando muitos recursos',
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
            newDisplay.scale((window.innerHeight - 60) / height);
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
