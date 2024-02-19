import { z } from 'zod';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Errors } from '../dtos/errors';
import { InstancePlatform, instancePlatformSchema } from '../dtos/instance-platform';

dayjs.extend(utc);

export const instanceTemplateDataSchema = z.object({
    id: z.string().nullable(),
    createdBy: z.string(),
    name: z.string(),
    description: z.string(),
    productId: z.string(),
    machineImageId: z.string(),
    platform: instancePlatformSchema,
    distribution: z.string(),
    storageInGb: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type InstanceTemplateData = z.infer<typeof instanceTemplateDataSchema>;

export class InstanceTemplate {
    private constructor(private data: InstanceTemplateData) {}
    toJSON = () => this.data;
    getData = () => this.data;

    static create = (props: {
        createdBy: string;
        name: string;
        description: string;
        productId: string;
        machineImageId: string;
        platform: InstancePlatform;
        distribution: string;
        storageInGb: number;
    }): InstanceTemplate => {
        const dateNow = dayjs.utc().toDate();
        const data: InstanceTemplateData = {
            id: null,
            createdBy: props.createdBy,
            name: props.name,
            description: props.description,
            productId: props.productId,
            machineImageId: props.machineImageId,
            platform: props.platform,
            distribution: props.distribution,
            storageInGb: props.storageInGb,
            createdAt: dateNow,
            updatedAt: dateNow,
        };

        const validation = instanceTemplateDataSchema.safeParse(data);
        if (!validation.success) throw Errors.validationError(validation.error);
        return new InstanceTemplate(data);
    };

    static restore = (props: InstanceTemplateData & { id: string }): InstanceTemplate => {
        const validation = instanceTemplateDataSchema.extend({ id: z.string() }).safeParse(props);
        if (!validation.success) {
            throw Errors.internalError(
                `Failed to restore InstanceTemplate: ${validation.error.message}`,
            );
        }
        return new InstanceTemplate(validation.data);
    };

    get id() {
        if (this.data.id === null)
            throw Errors.internalError(
                'Cannot get id of InstanceTemplate that has not been stored.',
            );
        return this.data.id;
    }

    set id(id: string) {
        if (this.data.id !== null)
            throw Errors.internalError(
                'Cannot set id of InstanceTemplate that has already been stored.',
            );
        this.data.id = id;
    }

    update = (props: { name?: string; description?: string }) => {
        const updatedData: InstanceTemplateData = {
            ...this.data,
            name: props.name ?? this.data.name,
            description: props.description ?? this.data.description,
            updatedAt: dayjs.utc().toDate(),
        };

        const validation = instanceTemplateDataSchema.safeParse(updatedData);
        if (!validation.success) throw Errors.validationError(validation.error);
        this.data = validation.data;
    };

    wasCreatedBy = (userId: string) => this.data.createdBy === userId;
}
