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

export type VirtualInstanceState =
    | 'PENDING'
    | 'RUNNING'
    | 'STOPPING'
    | 'STOPPED'
    | 'SHUTTING_DOWN'
    | 'TERMINATED';

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

export interface Group {
    id: string;
    createdBy: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Instance {
    id: string;
    virtualId?: string;
    ownerId: string;
    launchToken: string;
    name: string;
    description: string;
    connectionType?: InstanceConnectionType;
    platform?: string;
    distribution?: string;
    instanceType?: string;
    cpuCores?: string;
    memoryInGb?: string;
    storageInGb?: string;
    createdAt: string;
    updatedAt: string;
    lastConnectionAt?: string;
    state?: VirtualInstanceState;
}

export interface InstanceTemplate {
    id: string;
    name: string;
    description: string;
}

export interface InstanceConnection {
    connectionString: string;
}
