import { ObjectId } from 'mongodb';

export interface GroupDbModel {
    _id: ObjectId;
    name: string;
    description: string;
    createdBy: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
