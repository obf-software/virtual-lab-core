import { z } from 'zod';
import { Role, roleSchema } from '../dtos/role';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Errors } from '../dtos/errors';

dayjs.extend(utc);

const userDataSchema = z.object({
    id: z.string().nullable(),
    username: z.string(),
    role: roleSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLoginAt: z.date().optional(),
    groupIds: z.array(z.string()),
    quotas: z.object({
        maxInstances: z.number(),
        allowedInstanceTypes: z.array(z.string()),
        canLaunchInstanceWithHibernation: z.boolean(),
    }),
});

export type UserData = z.infer<typeof userDataSchema>;

export class User {
    private constructor(private data: UserData) {}
    toJSON = () => this.data;
    getData = () => this.data;

    static create(props: { username: string; role: 'PENDING' | 'USER' }): User {
        const dateNow = dayjs.utc().toDate();
        const data: UserData = {
            id: null,
            username: props.username,
            role: props.role,
            createdAt: dateNow,
            updatedAt: dateNow,
            lastLoginAt: undefined,
            groupIds: [],
            quotas: {
                maxInstances: 2,
                allowedInstanceTypes: ['t3.small'],
                canLaunchInstanceWithHibernation: false,
            },
        };

        const validation = userDataSchema.safeParse(data);
        if (!validation.success) throw Errors.validationError(validation.error);
        return new User(validation.data);
    }

    static restore(props: UserData & { id: string }): User {
        const validation = userDataSchema.safeParse(props);
        if (!validation.success || props.id === null)
            throw Errors.internalError('Failed to restore user');
        return new User(validation.data);
    }

    get id() {
        if (this.data.id === null)
            throw Errors.internalError('Cannot get id of user that has not been created');
        return this.data.id;
    }

    set id(id: string) {
        if (this.data.id !== null) throw Errors.internalError('Cannot set id of existing user');
        this.data.id = id;
    }

    update = (props: {
        role?: Role;
        maxInstances?: number;
        allowedInstanceTypes?: string[];
        canLaunchInstanceWithHibernation?: boolean;
        groupIds?: string[];
        lastLoginAt?: Date;
    }) => {
        const updatedData: UserData = {
            ...this.data,
            role: props.role ?? this.data.role,
            quotas: {
                maxInstances: props.maxInstances ?? this.data.quotas.maxInstances,
                allowedInstanceTypes:
                    props.allowedInstanceTypes ?? this.data.quotas.allowedInstanceTypes,
                canLaunchInstanceWithHibernation:
                    props.canLaunchInstanceWithHibernation ??
                    this.data.quotas.canLaunchInstanceWithHibernation,
            },
            groupIds: props.groupIds ?? this.data.groupIds,
            updatedAt: dayjs.utc().toDate(),
        };

        const validation = userDataSchema.safeParse(updatedData);
        if (!validation.success) throw Errors.validationError(validation.error);
        this.data = validation.data;
    };

    onSignIn() {
        this.update({ lastLoginAt: dayjs.utc().toDate() });
    }

    addToGroup = (groupId: string) => {
        const newGroupIds = new Set([...this.data.groupIds, groupId]);
        this.update({ groupIds: [...newGroupIds] });
    };

    removeFromGroup = (groupId: string) => {
        const newGroupIds = new Set([...this.data.groupIds]);
        newGroupIds.delete(groupId);
        this.update({ groupIds: [...newGroupIds] });
    };

    belongsToGroup = (groupId: string) => this.data.groupIds.includes(groupId);
}
