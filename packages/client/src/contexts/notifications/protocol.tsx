import { Instance } from '../../services/api/protocols';

export interface NotificationPayload {
    value: {
        data: {
            subscribe: {
                name: string;
                data: string;
            };
        };
    };
}

export enum NotificationType {
    'INSTANCE_STATE_CHANGED' = 'INSTANCE_STATE_CHANGED',
    'INSTANCE_PROVISIONED' = 'INSTANCE_PROVISIONED',
}

export interface NotificationData {
    type: keyof typeof NotificationType;
}

export type NotificationTypeMap = Record<keyof typeof NotificationType, unknown> & {
    [NotificationType.INSTANCE_STATE_CHANGED]: NotificationData & { instance: Instance };
    [NotificationType.INSTANCE_PROVISIONED]: NotificationData & { instance: Instance };
};

export interface ReadableNotification {
    id: string;
    text: string;
    viewed: boolean;
}

export interface NotificationsContextData {
    registerHandler: <T extends keyof typeof NotificationType, K = NotificationTypeMap[T]>(
        type: T,
        handler: (data: K) => void,
    ) => string;
    unregisterHandlerById: (id: string) => void;
    unregisterHandlerByType: (type: keyof typeof NotificationType) => void;
    unregisterAllHandlers: () => void;
    notifications: ReadableNotification[];
    markNotificationAsViewed: (id: string) => void;
}
