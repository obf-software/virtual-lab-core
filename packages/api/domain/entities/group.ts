import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Errors } from '../dtos/errors';

dayjs.extend(utc);

const groupDataSchema = z.object({
    id: z.string().nullable(),
    createdBy: z.string(),
    name: z.string(),
    description: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type GroupData = z.infer<typeof groupDataSchema>;

export class Group {
    private constructor(private data: GroupData) {}

    toJSON = () => this.data;

    static create(props: { name: string; description: string; portfolioId: string }): Group {
        const dateNow = dayjs.utc().toDate();
        const data: GroupData = {
            id: null,
            createdBy: props.portfolioId,
            name: props.name,
            description: props.description,
            createdAt: dateNow,
            updatedAt: dateNow,
        };

        const validation = groupDataSchema.safeParse(data);
        if (!validation.success) throw Errors.validationError(validation.error);
        return new Group(validation.data);
    }

    static restore(data: GroupData & { id: string }): Group {
        const validation = groupDataSchema.safeParse(data);
        if (!validation.success || data.id === null)
            throw Errors.internalError('Failed to restore group');
        return new Group(validation.data);
    }

    get id() {
        if (this.data.id === null)
            throw Errors.internalError('Cannot get id of group that has not been created');
        return this.data.id;
    }

    set id(id: string) {
        if (this.data.id !== null) throw Errors.internalError('Cannot set id of existing group');
        this.data.id = id;
    }

    getData() {
        return this.data;
    }

    update(data: { name?: string; description?: string }) {
        const updatedData: GroupData = {
            ...this.data,
            name: data.name ?? this.data.name,
            description: data.description ?? this.data.description,
            updatedAt: dayjs.utc().toDate(),
        };

        const validation = groupDataSchema.safeParse(updatedData);
        if (!validation.success) throw Errors.validationError(validation.error);
        this.data = validation.data;
    }
}
