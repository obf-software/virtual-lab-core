import { z } from 'zod';
import { ApplicationEvent, applicationEventDetailSchema } from '../dtos/application-event';

export const instanceConnectionStartedSchema = z
    .object({
        virtualId: z.string(),
    })
    .extend(applicationEventDetailSchema.shape);

export type InstanceConnectionStartedDetail = z.infer<typeof instanceConnectionStartedSchema>;

export class InstanceConnectionStarted extends ApplicationEvent<InstanceConnectionStartedDetail> {
    constructor(public detail: InstanceConnectionStartedDetail) {
        super('NONE', 'INSTANCE_CONNECTION_STARTED', instanceConnectionStartedSchema);
    }
}
