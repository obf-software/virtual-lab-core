import { z } from 'zod';
import { ApplicationEvent, applicationEventDetailSchema } from '../dtos/application-event';
import { instanceDataSchema } from '../entities/instance';
import { instanceStateSchema } from '../dtos/instance-state';

export const instanceLaunchedSchema = z
    .object({
        instance: instanceDataSchema,
        state: instanceStateSchema,
    })
    .extend(applicationEventDetailSchema.shape);

export type InstanceLaunchedDetail = z.infer<typeof instanceLaunchedSchema>;

export class InstanceLaunched extends ApplicationEvent<InstanceLaunchedDetail> {
    constructor(public detail: InstanceLaunchedDetail) {
        super('CLIENT', 'INSTANCE_LAUNCHED', instanceLaunchedSchema);
    }
}
