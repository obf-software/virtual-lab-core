export interface InstanceTypeDbModel {
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
