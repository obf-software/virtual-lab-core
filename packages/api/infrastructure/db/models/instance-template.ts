import { ObjectId } from 'mongodb';

export interface InstanceTemplateDbModel {
    _id: ObjectId;
    textSearch: string;
    createdBy: ObjectId;
    name: string;
    description: string;
    productId: string;
    machineImageId: string;
    storageInGb: number;
    createdAt: Date;
    updatedAt: Date;
}
