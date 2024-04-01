import { z } from 'zod';
import { ApplicationEvent, applicationEventDetailSchema } from '../dtos/application-event';

export const instanceConnectionEndedSchema = z
    .object({
        virtualId: z.string(),
    })
    .extend(applicationEventDetailSchema.shape);

export type InstanceConnectionEndedDetail = z.infer<typeof instanceConnectionEndedSchema>;

export class InstanceConnectionEnded extends ApplicationEvent<InstanceConnectionEndedDetail> {
    constructor(public detail: InstanceConnectionEndedDetail) {
        super('NONE', 'INSTANCE_CONNECTION_ENDED', instanceConnectionEndedSchema);
    }
}
