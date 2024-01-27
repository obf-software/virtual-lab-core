import { z } from 'zod';
import { ApplicationEvent, applicationEventDetailSchema } from '../dtos/application-event';
import { instanceDataSchema } from '../entities/instance';
import { instanceStateSchema } from '../dtos/instance-state';

export const instanceProvisionedSchema = z
    .object({
        instance: instanceDataSchema,
        state: instanceStateSchema,
    })
    .extend(applicationEventDetailSchema.shape);

export type InstanceProvisionedDetail = z.infer<typeof instanceProvisionedSchema>;

export class InstanceProvisioned extends ApplicationEvent<InstanceProvisionedDetail> {
    constructor(public detail: InstanceProvisionedDetail) {
        super('CLIENT', 'INSTANCE_PROVISIONED', instanceProvisionedSchema);
    }
}
