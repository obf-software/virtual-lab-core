import { InstanceState } from '../domain/dtos/instance-state';
import { VirtualInstanceDetailedInfo } from '../domain/dtos/virtual-instance-detailed-info';
import { VirtualInstanceLaunchParameters } from '../domain/dtos/virtual-instance-launch-parameters';
import { VirtualInstanceStack } from '../domain/dtos/virtual-instance-stack';
import { VirtualInstanceSummary } from '../domain/dtos/virtual-instance-summary';
import { Product } from '../domain/dtos/product';
import { MachineImage } from '../domain/dtos/machine-image';

export interface VirtualizationGateway {
    getInstanceSummary(virtualId: string): Promise<VirtualInstanceSummary>;
    getInstanceDetailedInfo(virtualId: string): Promise<VirtualInstanceDetailedInfo>;
    listInstancesStates(virtualIds: string[]): Promise<Record<string, InstanceState>>;
    getInstanceState(virtualId: string): Promise<InstanceState>;
    startInstance(virtualId: string): Promise<InstanceState>;
    stopInstance(virtualId: string, hibernate: boolean, force: boolean): Promise<InstanceState>;
    rebootInstance(virtualId: string): Promise<void>;
    terminateInstance(launchToken: string): Promise<void>;
    launchInstance(productId: string, parameters: VirtualInstanceLaunchParameters): Promise<string>;
    getInstanceStack(stackName: string): Promise<VirtualInstanceStack>;
    listProducts(): Promise<Product[]>;
    getProductById(productId: string): Promise<Product | undefined>;
    getMachineImageById(machineImageId: string): Promise<MachineImage | undefined>;
}
