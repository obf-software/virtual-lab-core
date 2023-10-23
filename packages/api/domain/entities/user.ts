import { z } from 'zod';
import { Role } from '../dtos/role';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ApplicationError } from '../errors/application-error';
import { CodingError } from '../errors/coding-error';

dayjs.extend(utc);

const userDataSchema = z.object({
    id: z.number().nullable(),
    username: z.string(),
    role: z.nativeEnum(Role),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLoginAt: z.date().nullable(),
    maxInstances: z.number(),
});

export type UserData = z.infer<typeof userDataSchema>;

export class User {
    private constructor(private data: UserData) {}
    toJSON = () => this.data;

    static create(username: string): User {
        const dateNow = dayjs.utc().toDate();
        const data: UserData = {
            id: null,
            username,
            role: Role.PENDING,
            maxInstances: 5,
            createdAt: dateNow,
            updatedAt: dateNow,
            lastLoginAt: null,
        };

        const validation = userDataSchema.safeParse(data);
        if (!validation.success) throw ApplicationError.invalidEntityData('user');
        return new User(validation.data);
    }

    static restore(data: UserData & { id: number }): User {
        const validation = userDataSchema.safeParse(data);
        if (!validation.success || data.id === null)
            throw ApplicationError.invalidEntityData('user');
        return new User(validation.data);
    }

    get id() {
        if (this.data.id === null)
            throw CodingError.unexpectedPrecondition('Cannot get id of new user');
        return this.data.id;
    }

    /**
     * Assigns an id to the user that is being created
     */
    setId(id: number) {
        if (this.data.id !== null)
            throw CodingError.unexpectedPrecondition('Cannot set id of existing user');
        this.data.id = id;
    }

    getData() {
        return this.data;
    }

    setRole(role: Role) {
        this.data.role = role;
        this.data.updatedAt = dayjs.utc().toDate();
    }

    setQuotas(maxInstances: number) {
        this.data.maxInstances = maxInstances;
        this.data.updatedAt = dayjs.utc().toDate();
    }

    onSignIn() {
        this.data.lastLoginAt = dayjs.utc().toDate();
    }
}
