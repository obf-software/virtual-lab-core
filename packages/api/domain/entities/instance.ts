import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
    InstanceConnectionType,
    instanceConnectionTypeSchema,
} from '../dtos/instance-connection-type';
import { InstanceState, instanceStateSchema } from '../dtos/instance-state';
import { Errors } from '../dtos/errors';

dayjs.extend(utc);

export const instanceDataSchema = z.object({
    id: z.string().nullable(),
    virtualId: z.string().optional(),
    ownerId: z.string(),
    launchToken: z.string(),
    name: z.string(),
    description: z.string(),
    connectionType: instanceConnectionTypeSchema.optional(),
    platform: z.string().optional(),
    distribution: z.string().optional(),
    instanceType: z.string().optional(),
    cpuCores: z.string().optional(),
    memoryInGb: z.string().optional(),
    storageInGb: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastConnectionAt: z.date().optional(),
    state: instanceStateSchema.optional(),
});

export type InstanceData = z.infer<typeof instanceDataSchema>;

export class Instance {
    private constructor(private data: InstanceData) {}
    toJSON = () => this.data;
    getData = () => this.data;

    static create = (props: {
        ownerId: string;
        launchToken: string;
        name: string;
        description: string;
    }): Instance => {
        const dateNow = dayjs.utc().toDate();
        const data: InstanceData = {
            id: null,
            virtualId: undefined,
            ownerId: props.ownerId,
            launchToken: props.launchToken,
            name: props.name,
            description: props.description,
            connectionType: undefined,
            platform: undefined,
            distribution: undefined,
            instanceType: undefined,
            cpuCores: undefined,
            memoryInGb: undefined,
            storageInGb: undefined,
            createdAt: dateNow,
            updatedAt: dateNow,
            lastConnectionAt: undefined,
            state: undefined,
        };

        const validation = instanceDataSchema.safeParse(data);
        if (!validation.success) throw Errors.validationError(validation.error);
        return new Instance(validation.data);
    };

    static restore = (props: InstanceData & { id: string }): Instance => {
        const validation = instanceDataSchema.safeParse(props);
        if (!validation.success || props.id === null)
            throw Errors.internalError('Failed to restore instance');
        return new Instance(validation.data);
    };

    get id() {
        if (this.data.id === null)
            throw Errors.internalError('Cannot get id of instance that has not been created');
        return this.data.id;
    }

    set id(id: string) {
        if (this.data.id !== null) throw Errors.internalError('Cannot set id of existing instance');
        this.data.id = id;
    }

    update = (props: {
        virtualId?: string;
        name?: string;
        description?: string;
        connectionType?: InstanceConnectionType;
        platform?: string;
        distribution?: string;
        instanceType?: string;
        cpuCores?: string;
        memoryInGb?: string;
        storageInGb?: string;
        lastConnectionAt?: Date;
    }) => {
        const updatedData: InstanceData = {
            ...this.data,
            virtualId: props.virtualId ?? this.data.virtualId,
            name: props.name ?? this.data.name,
            description: props.description ?? this.data.description,
            connectionType: props.connectionType ?? this.data.connectionType,
            platform: props.platform ?? this.data.platform,
            distribution: props.distribution ?? this.data.distribution,
            instanceType: props.instanceType ?? this.data.instanceType,
            cpuCores: props.cpuCores ?? this.data.cpuCores,
            memoryInGb: props.memoryInGb ?? this.data.memoryInGb,
            storageInGb: props.storageInGb ?? this.data.storageInGb,
            lastConnectionAt: props.lastConnectionAt ?? this.data.lastConnectionAt,
            updatedAt: dayjs.utc().toDate(),
        };

        const validation = instanceDataSchema.safeParse(updatedData);
        if (!validation.success) throw Errors.validationError(validation.error);
        this.data = validation.data;
    };

    onStateRetrieved = (state?: InstanceState) => {
        this.data.state = state;
    };

    onUserConnected = () => {
        this.update({ lastConnectionAt: dayjs.utc().toDate() });
    };

    /**
     * typeguard to check if instance has been launched
     */
    hasBeenLaunched = () => this.data.virtualId !== undefined;
    isReadyToConnect = () => this.data.state === 'RUNNING';
    isReadyToTurnOn = () => this.data.state === 'STOPPED';
    isReadyToTurnOff = () => this.data.state === 'RUNNING';
    isReadyToReboot = () => this.data.state === 'RUNNING';

    isOwnedBy = (userId: string) => this.data.ownerId === userId;
}
