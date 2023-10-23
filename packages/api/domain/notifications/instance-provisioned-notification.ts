import { VirtualInstanceState } from '../../application/virtualization-gateway';
import { Instance } from '../entities/instance';
import { Notification } from './notification';

export class InstanceProvisionedNotification extends Notification {
    constructor(
        readonly username: string,
        readonly instance: Instance,
        readonly instanceState: keyof typeof VirtualInstanceState,
    ) {
        super(username, 'INSTANCE_PROVISIONED', {
            instance: { ...instance.toJSON(), state: instanceState },
        });
    }
}
