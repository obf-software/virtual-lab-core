import { ObjectId } from 'mongodb';

export interface InstanceDbModel {
    _id: ObjectId;
    virtualId?: string;
    ownerId: ObjectId;
    launchToken: string;
    name: string;
    description: string;
    connectionType?: 'VNC' | 'RDP';
    platform?: string;
    distribution?: string;
    instanceType?: string;
    cpuCores?: string;
    memoryInGb?: string;
    storageInGb?: string;
    createdAt: Date;
    updatedAt: Date;
    lastConnectionAt?: Date;
}
