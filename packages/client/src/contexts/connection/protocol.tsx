import { UseToastOptions } from '@chakra-ui/react';

export enum ConnectionState {
    IDDLE = 'IDDLE',
    CONNECTING = 'CONNECTING',
    WAITING = 'WAITING',
    CONNECTED = 'CONNECTED',
    DISCONNECTING = 'DISCONNECTING',
    DISCONNECTED = 'DISCONNECTED',
}

export const stateMap: Record<
    number,
    { toast?: Omit<UseToastOptions, 'id'>; state: keyof typeof ConnectionState } | undefined
> = {
    0: { state: 'IDDLE' },
    1: {
        state: 'CONNECTING',
        toast: {
            title: 'Conectando com o servidor',
            description: 'Aguarde...',
            status: 'loading',
            variant: 'left-accent',
            position: 'bottom-left',
        },
    },
    2: {
        state: 'WAITING',
        toast: {
            title: 'Aguardando resposta do servidor',
            description: 'Aguarde...',
            status: 'loading',
            variant: 'left-accent',
            position: 'bottom-left',
        },
    },
    3: {
        state: 'CONNECTED',
        toast: {
            title: 'Conexão com o servidor estabelecida',
            description: 'Instância iniciada com sucesso!',
            status: 'success',
            variant: 'left-accent',
            position: 'bottom-left',
        },
    },
    4: {
        state: 'DISCONNECTING',
        toast: {
            title: 'Desconectando do servidor',
            description: 'Aguarde enquanto a conexão é encerrada',
            status: 'loading',
            variant: 'left-accent',
            position: 'bottom-left',
        },
    },
    5: {
        state: 'DISCONNECTED',
        toast: {
            title: 'Conexão com o servidor encerrada',
            status: 'info',
            variant: 'left-accent',
            position: 'bottom-left',
        },
    },
};

export interface ConnectionContextData {
    connect: (connectionString: string) => boolean;
    disconnect: () => void;
    element?: JSX.Element;
    connectionState: keyof typeof ConnectionState;
    lastSync?: number;
}
