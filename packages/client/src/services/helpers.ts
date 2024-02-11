import { Role } from './api-protocols';

export const roleToDisplayString = (role: string): string => {
    const roleToDisplayMap: Record<Role, string | undefined> = {
        PENDING: 'Pendente',
        ADMIN: 'Administrador',
        USER: 'Usuário',
        NONE: 'Nenhum cargo',
    };
    return roleToDisplayMap[role as Role] ?? 'Desconhecido';
};

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Erro desconhecido';
};
