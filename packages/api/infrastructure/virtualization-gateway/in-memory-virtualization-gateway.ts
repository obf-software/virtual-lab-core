/* eslint-disable @typescript-eslint/require-await */
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

export class AwsVirtualizationGateway implements VirtualizationGateway {
    constructor(
        private readonly storage: {
            virtualInstances?: (VirtualInstance & { launchToken: string })[];
        },
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
        hibernate: boolean,
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
        throw new Error('Method not implemented.');
    };

    getInstanceStack = async (stackName: string): Promise<VirtualInstanceStack> => {
        throw new Error('Method not implemented.');
    };

    getProductByInstancePlatform = async (platform: InstancePlatform): Promise<Product> => {
        throw new Error('Method not implemented.');
    };

    getMachineImageById = async (machineImageId: string): Promise<MachineImage | undefined> => {
        throw new Error('Method not implemented.');
    };

    listRecommendedMachineImages = async (): Promise<MachineImage[]> => {
        throw new Error('Method not implemented.');
    };

    createMachineImage = async (virtualId: string, storageInGb: number): Promise<string> => {
        throw new Error('Method not implemented.');
    };

    getInstanceType = async (instanceType: string): Promise<VirtualInstanceType | undefined> => {
        throw new Error('Method not implemented.');
    };

    listInstanceTypes = async (instanceTypes?: string[]): Promise<VirtualInstanceType[]> => {
        throw new Error('Method not implemented.');
    };

    scheduleInstanceOperation = async (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
        afterMinutes: number,
    ): Promise<void> => {
        throw new Error('Method not implemented.');
    };

    unscheduleInstanceOperation = async (
        virtualId: string,
        operation: VirtualizationGatewayScheduleOperation,
    ): Promise<void> => {
        throw new Error('Method not implemented.');
    };
}
