export type UrlPath = `/${string}`;
export type AuthorizationHeader = `Bearer ${string}`;

// TRANSACTIONAL TYPES

export interface SeekPaginated<T> {
    data: T[];
    resultsPerPage: number;
    numberOfPages: number;
    numberOfResults: number;
}

export interface KeysetPaginated<T> {
    data: T[];
    numberOfResults: number;
    nextCursor: string | null;
}

export interface ApiResponsex<T> {
    data?: T;
    error?: string;
}

interface SuccessResponse<T> {
    data: T;
    error: undefined;
}

interface ErrorResponse {
    data: undefined;
    error: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ENTITIES

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export interface User {
    id: string;
    username: string;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
}

export interface Group {
    id: string;
    name: string;
    description: string;
    portfolioId: string;
    createdAt: string;
    updatedAt: string;
}
