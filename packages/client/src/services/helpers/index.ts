import type { UseAuthenticator } from '@aws-amplify/ui-react';
import { Role } from '../api/protocols';

export const roleToDisplayString = (role: string): string => {
    const roleToDisplayMap: Record<keyof typeof Role, string | undefined> = {
        PENDING: 'Pendente',
        ADMIN: 'Administrador',
        USER: 'Usuário',
        NONE: 'Nenhum cargo',
    };

    return roleToDisplayMap[role as keyof typeof Role] ?? 'Desconhecido';
};

type SessionData = Partial<{
    idToken: string;
    username: string;
    role: string;
    userId: number;
    email: string;
    emailVerified: boolean;
    name: string;
}> & {
    displayName: string;
    displayRole: string;
};

export const parseSessionData = (user: UseAuthenticator['user']): SessionData => {
    const attributes = user.attributes as Partial<{
        email: string;
        email_verified: boolean;
        name: string;
    }>;

    const claims = user.getSignInUserSession()?.getIdToken().payload as Partial<{
        'cognito:username': string;
        'custom:role': string;
        'custom:userId': string;
    }>;

    const userId = !Number.isNaN(Number(claims?.['custom:userId']))
        ? Number(claims?.['custom:userId'])
        : undefined;

    return {
        idToken: user.getSignInUserSession()?.getIdToken().getJwtToken(),
        username: user.username ?? claims?.['cognito:username'],
        role: claims?.['custom:role'],
        userId,
        email: attributes?.email,
        emailVerified: attributes?.email_verified,
        name: attributes?.name,
        displayName:
            attributes?.name ??
            user.username ??
            claims?.['cognito:username'] ??
            attributes?.email ??
            'Usuário',
        displayRole: roleToDisplayString(claims?.['custom:role'] ?? ''),
    };
};

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Erro desconhecido';
};
