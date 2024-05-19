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

export interface InstanceType {
    name: string;
    cpu: {
        cores: number;
        threadsPerCore: number;
        vCpus: number;
        manufacturer: string;
        clockSpeedInGhz: number;
    };
    ram: {
        sizeInMb: number;
    };
    gpu: {
        totalGpuMemoryInMb: number;
        devices: {
            count: number;
            name: string;
            manufacturer: string;
            memoryInMb: number;
        }[];
    };
    hibernationSupport: boolean;
    networkPerformance: string;
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
    instanceType: InstanceType;
    storageInGb: string;
    createdAt: string;
    updatedAt: string;
    lastConnectionAt?: string;
    state?: InstanceState;
}

export interface User {
    id: string;
    username: string;
    name?: string;
    preferredUsername?: string;
    role: Role;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    quotas: {
        maxInstances: number;
        allowedInstanceTypes: InstanceType[];
        canLaunchInstanceWithHibernation: boolean;
    };
}

export interface InstanceConnection {
    connectionString: string;
}

export interface MachineImage {
    id: string;
    storageInGb: number;
    platform: InstancePlatform;
    distribution: string;
}
