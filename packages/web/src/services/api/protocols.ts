export type UrlPath = `/${string}`;
export type AuthorizationHeader = `Bearer ${string}`;

export interface Paginated<T> {
    data: T[];
    totalItems: number | null;
    cursor: string | null;
}

export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}
