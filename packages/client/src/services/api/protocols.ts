export type UrlPath = `/${string}`;

// TRANSACTIONAL TYPES

export interface SeekPaginated<T> {
    data: T[];
    resultsPerPage: number;
    numberOfPages: number;
    numberOfResults: number;
}

export interface SeekPaginationInput {
    resultsPerPage: number;
    page: number;
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

export enum Role {
    NONE = 'NONE',
    PENDING = 'PENDING',
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export enum InstanceConnectionType {
    RDP = 'RDP',
    VNC = 'VNC',
}

export enum VirtualInstanceState {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
    SHUTTING_DOWN = 'SHUTTING_DOWN',
    TERMINATED = 'TERMINATED',
}

export interface User {
    id: number;
    username: string;
    role: keyof typeof Role;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    maxInstances: number;
}

export interface Group {
    id: number;
    portfolioId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Instance {
    id: number;
    userId: number;
    logicalId: string | null;
    provisionToken: string;
    name: string;
    description: string;
    connectionType: keyof typeof InstanceConnectionType | null;
    platform: string | null;
    distribution: string | null;
    instanceType: string | null;
    cpuCores: string | null;
    memoryInGb: string | null;
    storageInGb: string | null;
    createdAt: string;
    updatedAt: string;
    lastConnectionAt: string | null;
    state: keyof typeof VirtualInstanceState | null;
}

export interface ProductProvisioningParameter {
    key: string;
    label: string;
    allowedValues?: string[];
    defaultValue?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
}

export interface Portfolio {
    id: string;
    name: string;
    description: string;
}

export interface InstanceConnection {
    connectionString: string;
}
