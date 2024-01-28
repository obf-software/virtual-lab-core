import { InstanceState } from '../domain/dtos/instance-state';
import { VirtualInstanceDetailedInfo } from '../domain/dtos/virtual-instance-detailed-info';
import { VirtualInstanceLaunchParameters } from '../domain/dtos/virtual-instance-launch-parameters';
import { VirtualInstanceStack } from '../domain/dtos/virtual-instance-stack';
import { VirtualInstanceSummary } from '../domain/dtos/virtual-instance-summary';
import { VirtualInstanceTemplate } from '../domain/dtos/virtual-instance-template';

export interface VirtualizationGateway {
    getInstanceSummary(virtualId: string): Promise<VirtualInstanceSummary>;
    getInstanceDetailedInfo(virtualId: string): Promise<VirtualInstanceDetailedInfo>;
    listInstancesStates(virtualIds: string[]): Promise<Record<string, InstanceState>>;
    getInstanceState(virtualId: string): Promise<InstanceState>;
    startInstance(virtualId: string): Promise<void>;
    stopInstance(virtualId: string, hibernate: boolean, force: boolean): Promise<void>;
    rebootInstance(virtualId: string): Promise<void>;
    listInstanceTemplates(): Promise<VirtualInstanceTemplate[]>;
    getInstanceTemplate(instanceTemplateId: string): Promise<VirtualInstanceTemplate>;
    launchInstance(
        instanceTemplateId: string,
        parameters: VirtualInstanceLaunchParameters,
    ): Promise<string>;
    terminateInstance(launchToken: string): Promise<void>;
    getInstanceStack(stackName: string): Promise<VirtualInstanceStack>;
}
