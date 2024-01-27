import { InstanceState } from '../domain/dtos/instance-state';
import { VirtualInstanceDetailedInfo } from '../domain/dtos/virtual-instance-detailed-info';
import { VirtualInstanceLaunchParameters } from '../domain/dtos/virtual-instance-launch-parameters';
import { VirtualInstanceStack } from '../domain/dtos/virtual-instance-stack';
import { VirtualInstanceSummary } from '../domain/dtos/virtual-instance-summary';
import { VirtualInstanceTemplate } from '../domain/dtos/virtual-instance-template';

export interface VirtualizationGateway {
    getInstanceSummary(instanceId: string): Promise<VirtualInstanceSummary>;
    getInstanceDetailedInfo(instanceId: string): Promise<VirtualInstanceDetailedInfo>;
    listInstancesStates(instanceIds: string[]): Promise<Record<string, InstanceState>>;
    getInstanceState(instanceId: string): Promise<InstanceState>;
    startInstance(instanceId: string): Promise<void>;
    stopInstance(instanceId: string, hibernate: boolean, force: boolean): Promise<void>;
    rebootInstance(instanceId: string): Promise<void>;
    listInstanceTemplates(): Promise<VirtualInstanceTemplate[]>;
    getInstanceTemplate(instanceTemplateId: string): Promise<VirtualInstanceTemplate>;
    launchInstance(
        instanceTemplateId: string,
        parameters: VirtualInstanceLaunchParameters,
    ): Promise<string>;
    terminateInstance(launchToken: string): Promise<void>;
    getInstanceStack(stackName: string): Promise<VirtualInstanceStack>;
}
