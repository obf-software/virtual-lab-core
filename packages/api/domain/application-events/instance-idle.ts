import { z } from 'zod';
import { ApplicationEvent, applicationEventDetailSchema } from '../dtos/application-event';

export const instanceIdleSchema = z
    .object({
        virtualId: z.string(),
    })
    .extend(applicationEventDetailSchema.shape);

export type InstanceIdleDetail = z.infer<typeof instanceIdleSchema>;

export class InstanceIdle extends ApplicationEvent<InstanceIdleDetail> {
    constructor(public detail: InstanceIdleDetail) {
        super('NONE', 'INSTANCE_IDLE', instanceIdleSchema);
    }
}
