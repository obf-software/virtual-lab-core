import { InstanceState } from '../domain/dtos/instance-state';
import { VirtualInstanceLaunchParameters } from '../domain/dtos/virtual-instance-launch-parameters';
import { VirtualInstanceStack } from '../domain/dtos/virtual-instance-stack';
import { VirtualInstance } from '../domain/dtos/virtual-instance';
import { Product } from '../domain/dtos/product';
import { MachineImage } from '../domain/dtos/machine-image';
import { VirtualInstanceType } from '../domain/dtos/virtual-instance-type';
import { InstancePlatform } from '../domain/dtos/instance-platform';

export interface VirtualizationGateway {
    getInstance(virtualId: string): Promise<VirtualInstance | undefined>;
    listInstancesStates(virtualIds: string[]): Promise<Record<string, InstanceState>>;
    startInstance(virtualId: string): Promise<InstanceState>;
    stopInstance(virtualId: string, hibernate: boolean, force: boolean): Promise<InstanceState>;
    rebootInstance(virtualId: string): Promise<void>;
    terminateInstance(launchToken: string): Promise<void>;
    launchInstance(productId: string, parameters: VirtualInstanceLaunchParameters): Promise<string>;
    getInstanceStack(stackName: string): Promise<VirtualInstanceStack>;
    getProductByInstancePlatform(platform: InstancePlatform): Promise<Product>;
    getMachineImageById(machineImageId: string): Promise<MachineImage | undefined>;
    listRecommendedMachineImages(): Promise<MachineImage[]>;
    createMachineImage(virtualId: string, storageInGb: number): Promise<string>;
    getInstanceType(instanceType: string): Promise<VirtualInstanceType | undefined>;
    listInstanceTypes(instanceTypes?: string[]): Promise<VirtualInstanceType[]>;
}
