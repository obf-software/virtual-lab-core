export type UrlPath = `/${string}`;

interface SuccessResponse<T> {
    success: true;
    data: T;
}

interface ErrorResponse {
    success: false;
    error: string;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface SeekPaginated<T> {
    data: T[];
    resultsPerPage: number;
    numberOfPages: number;
    numberOfResults: number;
}

export type Role = 'NONE' | 'PENDING' | 'USER' | 'ADMIN';

export type InstanceConnectionType = 'RDP' | 'VNC';

export type InstancePlatform = 'LINUX' | 'WINDOWS' | 'UNKNOWN';

export type InstanceState =
    | 'PENDING'
    | 'RUNNING'
    | 'STOPPING'
    | 'STOPPED'
    | 'SHUTTING_DOWN'
    | 'TERMINATED';

export interface Group {
    id: string;
    createdBy: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface InstanceTemplate {
    id: string;
    createdBy: string;
    name: string;
    description: string;
    productId: string;
    machineImageId: string;
    platform: InstancePlatform;
    distribution: string;
    storageInGb: number;
    createdAt: string;
    updatedAt: string;
}

export interface Instance {
    id: string;
    virtualId?: string;
    productId: string;
    machineImageId: string;
    ownerId: string;
    launchToken: string;
    name: string;
    description: string;
    connectionType?: InstanceConnectionType;
    canHibernate: boolean;
    platform: InstancePlatform;
    distribution: string;
    instanceType: string;
    cpuCores: string;
    memoryInGb: string;
    storageInGb: string;
    createdAt: string;
    updatedAt: string;
    lastConnectionAt?: string;
    state?: InstanceState;
}

export interface User {
    id: string;
    username: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    groupIds: string[];
    quotas: {
        maxInstances: number;
        allowedInstanceTypes: string[];
        canLaunchInstanceWithHibernation: boolean;
    };
}

export interface InstanceConnection {
    connectionString: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
}
