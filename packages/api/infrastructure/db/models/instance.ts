import { ObjectId } from 'mongodb';

export interface InstanceDbModel {
    _id: ObjectId;
    virtualId?: string;
    ownerId: ObjectId;
    launchToken: string;
    name: string;
    description: string;
    connectionType?: 'VNC' | 'RDP';
    canHibernate: boolean;
    platform: 'LINUX' | 'WINDOWS' | 'UNKNOWN';
    distribution: string;
    instanceType: string;
    cpuCores: string;
    memoryInGb: string;
    storageInGb: string;
    createdAt: Date;
    updatedAt: Date;
    lastConnectionAt?: Date;

    textSearch: string;
}
