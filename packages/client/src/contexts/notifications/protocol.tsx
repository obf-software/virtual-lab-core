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
    'EC2_INSTANCE_STATE_CHANGED' = 'EC2_INSTANCE_STATE_CHANGED',
}

export interface NotificationData {
    type: keyof typeof NotificationType;
}

export type NotificationTypeMap = Record<keyof typeof NotificationType, NotificationData> & {
    [NotificationType.EC2_INSTANCE_STATE_CHANGED]: {
        type: NotificationType.EC2_INSTANCE_STATE_CHANGED;
        instanceId: string;
        state: string;
    };
};

export interface NotificationsContextData {
    registerHandler: <T extends keyof typeof NotificationType, K = NotificationTypeMap[T]>(
        type: T,
        handler: (data: K) => void,
    ) => void;
    unregisterHandlerById: (id: string) => void;
    unregisterHandlerByType: (type: keyof typeof NotificationType) => void;
    unregisterAllHandlers: () => void;
}
