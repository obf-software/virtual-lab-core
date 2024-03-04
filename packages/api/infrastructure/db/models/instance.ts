import { ObjectId } from 'mongodb';
import { InstanceTypeDbModel } from './instance-type';

export interface InstanceDbModel {
    _id: ObjectId;
    virtualId?: string;
    productId: string;
    machineImageId: string;
    ownerId: ObjectId;
    launchToken: string;
    name: string;
    description: string;
    connectionType?: 'VNC' | 'RDP';
    canHibernate: boolean;
    platform: 'LINUX' | 'WINDOWS' | 'UNKNOWN';
    distribution: string;
    instanceType: InstanceTypeDbModel;
    storageInGb: string;
    createdAt: Date;
    updatedAt: Date;
    lastConnectionAt?: Date;

    textSearch: string;
}
