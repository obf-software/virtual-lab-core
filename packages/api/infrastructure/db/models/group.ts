import { ObjectId } from 'mongodb';

export interface GroupDbModel {
    _id: ObjectId;
    textSearch: string;
    name: string;
    description: string;
    createdBy: ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
