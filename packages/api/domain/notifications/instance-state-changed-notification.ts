import { VirtualInstanceState } from '../../application/virtualization-gateway';
import { Instance } from '../entities/instance';
import { Notification } from './notification';

export class InstanceStateChangedNotification extends Notification {
    constructor(
        readonly username: string,
        readonly instance: Instance,
        readonly instanceState: keyof typeof VirtualInstanceState,
    ) {
        super(username, 'INSTANCE_STATE_CHANGED', {
            instance: { ...instance.toJSON(), state: instanceState },
        });
    }
}
