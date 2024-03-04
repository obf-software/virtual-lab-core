import { ObjectId } from 'mongodb';
import { InstanceTypeDbModel } from './instance-type';

export interface UserDbModel {
    _id: ObjectId;
    username: string;
    name?: string;
    preferredUsername?: string;
    role: 'NONE' | 'PENDING' | 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    groupIds: ObjectId[];
    quotas: {
        maxInstances: number;
        allowedInstanceTypes: InstanceTypeDbModel[];
        canLaunchInstanceWithHibernation: boolean;
    };

    textSearch: string;
}
