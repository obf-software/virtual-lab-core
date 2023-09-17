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
    NONE = 'NONE',
    PENDING = 'PENDING',
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export interface User {
    id: string;
    username: string;
    role: keyof typeof UserRole;
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

export enum InstanceConnectionType {
    SSH = 'SSH',
    VNC = 'VNC',
    RDP = 'RDP',
}

export interface Instance {
    id: number;
    userId: number;
    awsInstanceId: string;
    name: string;
    description?: string;
    connectionType: keyof typeof InstanceConnectionType;
    platform: string;
    distribution: string;
    instanceType: string;
    cpu: string;
    memoryInGb: string;
    storageInGb: string;
    tags?: string;
    createdAt: string;
    lastConnectionAt: string;

    /**
     * This property is not stored in the database. It is added by the API.
     * If the value is undefined, ti means the instance is not running or the
     * API has not been able to fetch the status from AWS.
     */
    state?: 'pending' | 'running' | 'shutting-down' | 'stopped' | 'stopping' | 'terminated';
}
