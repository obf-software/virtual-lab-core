import { z } from 'zod';
import { ApplicationEvent, applicationEventDetailSchema } from '../dtos/application-event';
import { instanceDataSchema } from '../entities/instance';
import { instanceStateSchema } from '../dtos/instance-state';

export const instanceStateChangedSchema = z
    .object({
        instance: instanceDataSchema,
        state: instanceStateSchema,
    })
    .extend(applicationEventDetailSchema.shape);

export type InstanceStateChangedDetail = z.infer<typeof instanceStateChangedSchema>;

export class InstanceStateChanged extends ApplicationEvent<InstanceStateChangedDetail> {
    constructor(public detail: InstanceStateChangedDetail) {
        super('CLIENT', 'INSTANCE_STATE_CHANGED', instanceStateChangedSchema);
    }
}
