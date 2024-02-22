import { IconType } from 'react-icons';
import { Role, InstanceState, InstancePlatform } from './api-protocols';
import { FaLinux, FaQuestion, FaWindows } from 'react-icons/fa';

export const roleToDisplayString = (role?: Role): string => {
    const roleToDisplayMap: Record<Role, string | undefined> = {
        PENDING: 'Pendente',
        ADMIN: 'Administrador',
        USER: 'Usuário',
        NONE: 'Nenhum cargo',
    };
    return roleToDisplayMap[role ?? ('' as Role)] ?? 'Desconhecido';
};

export const instanceStateToDisplayString = (state?: InstanceState): string => {
    const stateToDisplayMap: Record<InstanceState, string | undefined> = {
        PENDING: 'Iniciando',
        RUNNING: 'Ativa',
        STOPPED: 'Desligada',
        STOPPING: 'Desligando',
        SHUTTING_DOWN: 'Encerrando',
        TERMINATED: 'Encerrada',
    };
    return stateToDisplayMap[state ?? ('' as InstanceState)] ?? 'Desconhecido';
};

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Erro desconhecido';
};

export const getInstancePlatformIcon = (platform?: InstancePlatform): IconType => {
    const platformIconMap: Record<InstancePlatform, IconType> = {
        LINUX: FaLinux,
        WINDOWS: FaWindows,
        UNKNOWN: FaQuestion,
    };
    return platformIconMap[platform ?? ('' as InstancePlatform)] ?? FaQuestion;
};
