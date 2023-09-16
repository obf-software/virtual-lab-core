export enum ConnectionState {
    IDDLE = 'IDDLE',
    CONNECTING = 'CONNECTING',
    WAITING = 'WAITING',
    CONNECTED = 'CONNECTED',
    DISCONNECTING = 'DISCONNECTING',
    DISCONNECTED = 'DISCONNECTED',
}

export interface ConnectionContextData {
    connect: (token: string) => boolean;
    disconnect: () => void;
    bindControls: () => void;
    unbindControls: () => void;
    element?: JSX.Element;
    connectionState: keyof typeof ConnectionState;
    lastSync?: number;
}
