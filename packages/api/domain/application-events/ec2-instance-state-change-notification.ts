import { z } from 'zod';
import { ApplicationEvent, applicationEventDetailSchema } from '../dtos/application-event';

export const ec2InstanceStateChangeNotificationSchema = z
    .object({
        'instance-id': z.string(),
        state: z.enum(['pending', 'running', 'shutting-down', 'stopped', 'stopping', 'terminated']),
    })
    .extend(applicationEventDetailSchema.shape);

export type EC2InstanceStateChangeNotificationDetail = z.infer<
    typeof ec2InstanceStateChangeNotificationSchema
>;

/**
 * This event is triggered when an EC2 instance is launched. Should not be fired manually.
 */
export class EC2InstanceStateChangeNotification extends ApplicationEvent<EC2InstanceStateChangeNotificationDetail> {
    private constructor(public detail: EC2InstanceStateChangeNotificationDetail) {
        super(
            'NONE',
            'EC2 Instance State-change Notification',
            ec2InstanceStateChangeNotificationSchema,
        );
    }
}
