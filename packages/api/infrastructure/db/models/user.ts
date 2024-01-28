import { ObjectId } from 'mongodb';

export interface UserDbModel {
    _id: ObjectId;
    username: string;
    role: 'NONE' | 'PENDING' | 'USER' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    groupIds: ObjectId[];
    quotas: {
        maxIntances: number;
        allowedInstanceTypes: string[];
        canLaunchInstanceWithHibernation: boolean;
    };
}