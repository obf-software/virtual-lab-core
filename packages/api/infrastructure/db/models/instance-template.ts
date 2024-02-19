import { ObjectId } from 'mongodb';

export interface InstanceTemplateDbModel {
    _id: ObjectId;
    createdBy: ObjectId;
    name: string;
    description: string;
    productId: string;
    machineImageId: string;
    platform: 'LINUX' | 'WINDOWS' | 'UNKNOWN';
    distribution: string;
    storageInGb: number;
    createdAt: Date;
    updatedAt: Date;

    textSearch: string;
}
