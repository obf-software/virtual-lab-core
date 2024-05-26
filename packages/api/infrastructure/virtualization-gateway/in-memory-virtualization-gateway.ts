import {
    VirtualizationGateway,
    VirtualizationGatewayScheduleOperation,
} from '../../application/virtualization-gateway';
import { InstanceState } from '../../domain/dtos/instance-state';
import { VirtualInstance } from '../../domain/dtos/virtual-instance';
import { Product } from '../../domain/dtos/product';
import { VirtualInstanceLaunchParameters } from '../../domain/dtos/virtual-instance-launch-parameters';
import { VirtualInstanceStack } from '../../domain/dtos/virtual-instance-stack';
import { MachineImage } from '../../domain/dtos/machine-image';
import { VirtualInstanceType } from '../../domain/dtos/virtual-instance-type';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { InstancePlatform } from '../../domain/dtos/instance-platform';
import { randomUUID } from 'node:crypto';

dayjs.extend(utc);

export class InMemoryVirtualizationGateway implements VirtualizationGateway {
    constructor(
        private storage: {
            virtualInstances?: (VirtualInstance & { launchToken: string })[];
            instanceTypes?: VirtualInstanceType[];
            machineImages?: MachineImage[];
            instanceOperations?: {
                name: string;
                operation: VirtualizationGatewayScheduleOperation;
                scheduledAt: Date;
                runAt: Date;
            }[];
            instancePlatformToProductMap?: Record<InstancePlatform, Product | undefined>;
            instanceStacks?: Record<string, VirtualInstanceStack>;
        } = {},
    ) {}

    addInstanceTestRecord = (data: Partial<VirtualInstance & { launchToken: string }> = {}) => {
        const record: VirtualInstance & { launchToken: string } = {
            virtualId: data.virtualId ?? randomUUID(),
            hostname: data.hostname ?? randomUUID(),
            state: data.state ?? 'RUNNING',
            launchToken: data.launchToken ?? randomUUID(),
        };

        this.storage.virtualInstances ??= [];
        this.storage.virtualInstances.push(record);

        return record;
    };

    addInstanceTypeTestRecord = (data: Partial<VirtualInstanceType> = {}) => {
        const record: VirtualInstanceType = {
            name: data.name ?? randomUUID(),
            cpu: {
                clockSpeedInGhz: data.cpu?.clockSpeedInGhz ?? 2.3,
                cores: data.cpu?.cores ?? 1,
                manufacturer: data.cpu?.manufacturer ?? 'Intel',
                threadsPerCore: data.cpu?.threadsPerCore ?? 1,
                vCpus: data.cpu?.vCpus ?? 1,
            },
            ram: {
                sizeInMb: data.ram?.sizeInMb ?? 2048,
            },
            gpu: {
                totalGpuMemoryInMb: data.gpu?.totalGpuMemoryInMb ?? 0,
                devices: data.gpu?.devices ?? [],
            },
            hibernationSupport: data.hibernationSupport ?? false,
            networkPerformance: data.networkPerformance ?? 'LOW',
        };

        this.storage.instanceTypes ??= [];
        this.storage.instanceTypes.push(record);

        return record;
    };

    addMachineImageTestRecord = (data: Partial<MachineImage> = {}) => {
        const record: MachineImage = {
            id: data.id ?? randomUUID(),
            distribution: data.distribution ?? 'Ubuntu',
            platform: data.platform ?? 'UNKNOWN',
            storageInGb: data.storageInGb ?? 8,
        };

        this.storage.machineImages ??= [];
        this.storage.machineImages.push(record);

        return record;
    };

    addInstanceOperationTestRecord = (data: {
        virtualId: string;
        operation?: VirtualizationGatewayScheduleOperation;
        scheduledAt?: Date;
        runAt?: Date;
    }) => {
        const record: {
            name: string;
            operation: VirtualizationGatewayScheduleOperation;
            scheduledAt: Date;
            runAt: Date;
        } = {
            name: this.getScheduledOperationName(
                data.virtualId ?? randomUUID(),
                data.operation ?? 'turnOff',
            ),
            operation: data.operation ?? 'turnOff',
            scheduledAt: data.scheduledAt ?? new Date(),
            runAt: data.runAt ?? new Date(),
        };

        this.storage.instanceOperations ??= [];
        this.storage.instanceOperations.push(record);

        return record;
    };

    addInstancePlatformToProductMapTestRecord = (data: {
        platform: InstancePlatform;
        product: Partial<Product>;
    }) => {
        const record: Product = {
            id: data.product.id ?? randomUUID(),
            name: data.product.name ?? `Product ${randomUUID()}`,
            description: data.product.description ?? `Description ${randomUUID()}`,
        };

        this.storage.instancePlatformToProductMap ??= {
            LINUX: undefined,
            WINDOWS: undefined,
            UNKNOWN: undefined,
        };
        this.storage.instancePlatformToProductMap[data.platform] = record;

        return record;
    };

    addInstanceStackTestRecord = (data: Partial<VirtualInstanceStack> = {}) => {
        const stackName = randomUUID();

        const record: VirtualInstanceStack = {
            virtualId: data.virtualId ?? randomUUID(),
            launchToken: data.launchToken ?? randomUUID(),
            connectionType: data.connectionType ?? 'VNC',
        };

        this.storage.instanceStacks ??= {};
        this.storage.instanceStacks[stackName] = record;

        return {
            ...record,
            stackName,
        };
    };

    reset = () => {
        this.storage = {};
    };

    private getScheduledOperationName = (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
    ): string => {
        return `virtual-lab-core-${virtualId}-${operation}`;
    };

    getInstance = async (virtualId: string): Promise<VirtualInstance | undefined> => {
        return Promise.resolve(
            this.storage.virtualInstances?.find((i) => i.virtualId === virtualId),
        );
    };

    listInstancesStates = async (virtualIds: string[]): Promise<Record<string, InstanceState>> => {
        return Promise.resolve(
            this.storage.virtualInstances?.reduce(
                (acc, virtualInstance) => {
                    if (!virtualIds.includes(virtualInstance.virtualId)) return acc;
                    acc[virtualInstance.virtualId] = virtualInstance.state;
                    return acc;
                },
                {} as Record<string, InstanceState>,
            ) ?? {},
        );
    };

    startInstance = async (virtualId: string): Promise<InstanceState> => {
        const instance = this.storage.virtualInstances?.find((i) => i.virtualId === virtualId);

        if (!instance) {
            throw new Error('Instance not found');
        }

        if (instance.state !== 'STOPPED') {
            throw new Error('Instance is not stopped');
        }

        this.storage.virtualInstances = this.storage.virtualInstances?.map((i) => {
            if (i.virtualId === virtualId) {
                return {
                    ...i,
                    state: 'RUNNING',
                };
            }
            return i;
        });

        return Promise.resolve(instance.state);
    };

    stopInstance = async (
        virtualId: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        hibernate: boolean,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        force: boolean,
    ): Promise<InstanceState> => {
        const instance = this.storage.virtualInstances?.find((i) => i.virtualId === virtualId);

        if (!instance) {
            throw new Error('Instance not found');
        }

        if (instance.state !== 'RUNNING') {
            throw new Error('Instance is not running');
        }

        this.storage.virtualInstances = this.storage.virtualInstances?.map((i) => {
            if (i.virtualId === virtualId) {
                return {
                    ...i,
                    state: 'STOPPED',
                };
            }
            return i;
        });

        return Promise.resolve(instance.state);
    };

    rebootInstance = async (virtualId: string): Promise<void> => {
        const instance = this.storage.virtualInstances?.find((i) => i.virtualId === virtualId);

        if (!instance) {
            throw new Error('Instance not found');
        }

        if (instance.state !== 'RUNNING') {
            throw new Error('Instance is not running');
        }

        return Promise.resolve();
    };

    terminateInstance = async (launchToken: string): Promise<void> => {
        const instance = this.storage.virtualInstances?.find((i) => i.launchToken === launchToken);

        if (!instance) {
            throw new Error('Instance not found');
        }

        this.storage.virtualInstances = this.storage.virtualInstances?.filter(
            (i) => i.virtualId !== launchToken,
        );

        return Promise.resolve();
    };

    launchInstance = async (
        productId: string,
        parameters: VirtualInstanceLaunchParameters,
    ): Promise<string> => {
        const launchToken = randomUUID();

        this.storage.virtualInstances ??= [];
        this.storage.virtualInstances.push({
            virtualId: randomUUID(),
            hostname: `hostname-${JSON.stringify(parameters)}-${productId}`,
            launchToken,
            state: 'PENDING',
        });

        return Promise.resolve(launchToken);
    };

    getInstanceStack = async (stackName: string): Promise<VirtualInstanceStack> => {
        const stack = this.storage.instanceStacks?.[stackName];

        if (!stack) {
            throw new Error('Stack not found');
        }

        return Promise.resolve(stack);
    };

    getProductByInstancePlatform = async (platform: InstancePlatform): Promise<Product> => {
        const product = this.storage.instancePlatformToProductMap?.[platform];

        if (!product) {
            throw new Error('Product not found');
        }

        return Promise.resolve(product);
    };

    getMachineImageById = async (machineImageId: string): Promise<MachineImage | undefined> => {
        return Promise.resolve(this.storage.machineImages?.find((i) => i.id === machineImageId));
    };

    listRecommendedMachineImages = async (): Promise<MachineImage[]> => {
        return Promise.resolve(this.storage.machineImages ?? []);
    };

    createMachineImage = async (virtualId: string, storageInGb: number): Promise<string> => {
        const id = randomUUID();

        this.storage.machineImages ??= [];
        this.storage.machineImages.push({
            id,
            distribution: `Ubuntu from ${virtualId}`,
            platform: 'UNKNOWN',
            storageInGb,
        });

        return Promise.resolve(id);
    };

    getInstanceType = async (instanceType: string): Promise<VirtualInstanceType | undefined> => {
        return Promise.resolve(this.storage.instanceTypes?.find((i) => i.name === instanceType));
    };

    listInstanceTypes = async (instanceTypes?: string[]): Promise<VirtualInstanceType[]> => {
        return Promise.resolve(
            instanceTypes !== undefined
                ? this.storage.instanceTypes?.filter((i) => instanceTypes.includes(i.name)) ?? []
                : this.storage.instanceTypes ?? [],
        );
    };

    scheduleInstanceOperation = async (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
        afterMinutes: number,
    ): Promise<void> => {
        const dateNow = dayjs.utc();

        this.storage.instanceOperations ??= [];
        this.storage.instanceOperations.push({
            name: this.getScheduledOperationName(virtualId, operation),
            operation,
            scheduledAt: dateNow.toDate(),
            runAt: dateNow.add(afterMinutes, 'minutes').toDate(),
        });

        return Promise.resolve();
    };

    unscheduleInstanceOperation = async (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
    ): Promise<void> => {
        this.storage.instanceOperations = this.storage.instanceOperations?.filter(
            (i) => i.name !== this.getScheduledOperationName(virtualId, operation),
        );

        return Promise.resolve();
    };
}
