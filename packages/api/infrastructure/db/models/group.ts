import { ObjectId } from 'mongodb';

export interface GroupDbModel {
    _id: ObjectId;
    createdBy: ObjectId;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;

    textSearch: string;
}
