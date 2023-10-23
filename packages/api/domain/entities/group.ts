import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ApplicationError } from '../errors/application-error';
import { CodingError } from '../errors/coding-error';

dayjs.extend(utc);

const groupDataSchema = z.object({
    id: z.number().nullable(),
    portfolioId: z.string(),
    name: z.string(),
    description: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type GroupData = z.infer<typeof groupDataSchema>;

export class Group {
    private constructor(private data: GroupData) {}
    toJSON = () => this.data;

    static create(name: string, description: string, portfolioId: string): Group {
        const dateNow = dayjs.utc().toDate();
        const data: GroupData = {
            id: null,
            name,
            description,
            portfolioId,
            createdAt: dateNow,
            updatedAt: dateNow,
        };

        const validation = groupDataSchema.safeParse(data);
        if (!validation.success) throw ApplicationError.invalidEntityData('group');
        return new Group(validation.data);
    }

    static restore(data: GroupData & { id: number }): Group {
        const validation = groupDataSchema.safeParse(data);
        if (!validation.success || data.id === null)
            throw ApplicationError.invalidEntityData('group');
        return new Group(validation.data);
    }

    get id() {
        if (this.data.id === null)
            throw CodingError.unexpectedPrecondition('Cannot get id of new group');
        return this.data.id;
    }

    /**
     * Assigns an id to the group that is being created
     */
    setId(id: number) {
        if (this.data.id !== null)
            throw CodingError.unexpectedPrecondition('Cannot set id of existing group');
        this.data.id = id;
    }

    getData() {
        return this.data;
    }

    update(data: Partial<Pick<GroupData, 'name' | 'description' | 'portfolioId'>>) {
        const updatedData: GroupData = {
            ...this.data,
            name: data.name ?? this.data.name,
            description: data.description ?? this.data.description,
            portfolioId: data.portfolioId ?? this.data.portfolioId,
            updatedAt: dayjs.utc().toDate(),
        };

        const validation = groupDataSchema.safeParse(updatedData);
        if (!validation.success) throw ApplicationError.invalidEntityData('group');
        this.data = validation.data;
    }
}
