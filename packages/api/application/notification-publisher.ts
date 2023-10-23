import { Notification } from '../domain/notifications/notification';

export interface NotificationPublisher {
    publish(notification: Notification): Promise<void>;
}
