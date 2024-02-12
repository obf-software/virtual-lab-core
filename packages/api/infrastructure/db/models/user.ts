import { ObjectId } from 'mongodb';

export interface UserDbModel {
    _id: ObjectId;
    textSearch: string;
    username: string;
    role: 'NONE' | 'PENDING' | 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    groupIds: ObjectId[];
    quotas: {
        maxInstances: number;
        allowedInstanceTypes: string[];
        canLaunchInstanceWithHibernation: boolean;
    };
}
