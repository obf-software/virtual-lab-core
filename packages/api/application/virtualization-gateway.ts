export interface VirtualInstanceSummary {
    id: string;
    state: VirtualInstanceState;
    hostname: string;
}

export interface VirtualInstanceDetailedInfo {
    id: string;
    state: VirtualInstanceState;
    instanceType: string;
    memoryInGb: string;
    cpuCores: string;
    distribution: string;
    platform: string;
    storageInGb: string;
}

export enum VirtualInstanceState {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    STOPPING = 'STOPPING',
    STOPPED = 'STOPPED',
    SHUTTING_DOWN = 'SHUTTING_DOWN',
    TERMINATED = 'TERMINATED',
}

export interface VirtualizationGateway {
    getInstanceSummaryById(instanceId: string): Promise<VirtualInstanceSummary>;
    getInstanceDetailedInfoById(instanceId: string): Promise<VirtualInstanceDetailedInfo>;
    listInstanceStates(instanceIds: string[]): Promise<Record<string, VirtualInstanceState>>;
    getInstanceState(instanceId: string): Promise<VirtualInstanceState>;
    startInstance(instanceId: string): Promise<void>;
    stopInstance(instanceId: string, hibernate: boolean, force: boolean): Promise<void>;
    rebootInstance(instanceId: string): Promise<void>;
}
