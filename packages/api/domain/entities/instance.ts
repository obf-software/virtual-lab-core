import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ApplicationError } from '../errors/application-error';
import { InstanceConnectionType } from '../dtos/instance-connection-type';
import { CodingError } from '../errors/coding-error';
import { VirtualInstanceState } from '../../application/virtualization-gateway';

dayjs.extend(utc);

const instanceDataSchema = z.object({
    id: z.number().nullable(),
    userId: z.number(),
    logicalId: z.string().nullable(),
    provisionToken: z.string(),
    name: z.string(),
    description: z.string(),
    connectionType: z.nativeEnum(InstanceConnectionType).nullable(),
    platform: z.string().nullable(),
    distribution: z.string().nullable(),
    instanceType: z.string().nullable(),
    cpuCores: z.string().nullable(),
    memoryInGb: z.string().nullable(),
    storageInGb: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastConnectionAt: z.date().nullable(),
    state: z.nativeEnum(VirtualInstanceState).nullable(),
});

export type InstanceData = z.infer<typeof instanceDataSchema>;

export class Instance {
    private constructor(private data: InstanceData) {}
    toJSON = () => this.data;

    static create(
        name: string,
        description: string,
        userId: number,
        provisionToken: string,
    ): Instance {
        const dateNow = dayjs.utc().toDate();
        const data: InstanceData = {
            id: null,
            userId,
            logicalId: null,
            provisionToken,
            name,
            description,
            connectionType: null,
            platform: null,
            distribution: null,
            instanceType: null,
            cpuCores: null,
            memoryInGb: null,
            storageInGb: null,
            createdAt: dateNow,
            updatedAt: dateNow,
            lastConnectionAt: null,
            state: null,
        };

        const validation = instanceDataSchema.safeParse(data);
        if (!validation.success) throw ApplicationError.invalidEntityData('instance');

        return new Instance(validation.data);
    }

    static restore(data: InstanceData & { id: number }): Instance {
        const validation = instanceDataSchema.safeParse(data);
        if (!validation.success || data.id === null)
            throw ApplicationError.invalidEntityData('instance');
        return new Instance(validation.data);
    }

    get id() {
        if (this.data.id === null)
            throw CodingError.unexpectedPrecondition('Cannot get id of new instance');
        return this.data.id;
    }

    /**
     * Assigns an id to the instance that is being created
     */
    setId(id: number) {
        if (this.data.id !== null)
            throw CodingError.unexpectedPrecondition('Cannot set id of existing instance');
        this.data.id = id;
    }

    setState(state?: VirtualInstanceState) {
        this.data.state = state ?? null;
    }

    isReadyToConnect() {
        if (this.data.state === null)
            throw CodingError.unexpectedPrecondition(
                'Cannot check state of instance without state',
            );
        return this.data.state === VirtualInstanceState.RUNNING;
    }

    isReadyToTurnOn() {
        if (this.data.state === null)
            throw CodingError.unexpectedPrecondition(
                'Cannot check state of instance without state',
            );
        return this.data.state === VirtualInstanceState.STOPPED;
    }

    isReadyToTurnOff() {
        if (this.data.state === null)
            throw CodingError.unexpectedPrecondition(
                'Cannot check state of instance without state',
            );
        return this.data.state === VirtualInstanceState.RUNNING;
    }

    isReadyToReboot() {
        if (this.data.state === null)
            throw CodingError.unexpectedPrecondition(
                'Cannot check state of instance without state',
            );
        return this.data.state === VirtualInstanceState.RUNNING;
    }

    getData() {
        return this.data;
    }

    onUserConnection() {
        this.data.lastConnectionAt = dayjs.utc().toDate();
    }

    onProvisioned(
        data: Pick<
            InstanceData,
            | 'logicalId'
            | 'connectionType'
            | 'platform'
            | 'distribution'
            | 'instanceType'
            | 'cpuCores'
            | 'memoryInGb'
            | 'storageInGb'
        >,
    ) {
        const updatedData: InstanceData = {
            ...this.data,
            ...data,
            updatedAt: dayjs.utc().toDate(),
        };

        const validation = instanceDataSchema.safeParse(updatedData);
        if (!validation.success) throw ApplicationError.invalidEntityData('instance');
        this.data = validation.data;
    }
}
