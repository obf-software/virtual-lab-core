import { Instance, InstanceState } from '../../services/api-protocols';

export const applicationEventSubscriptionQuery = `subscription Subscribe($name: String!) {
    subscribe(name: $name) {
        name
        data
        __typename
    }
}
` as string & {
    __generatedSubscriptionInput: {
        name: string;
    };
    __generatedSubscriptionOutput: {
        subscribe?: {
            __typename: 'Channel';
            name: string;
            data: string;
        } | null;
    };
};

export type ApplicationEventType = 'INSTANCE_LAUNCHED' | 'INSTANCE_STATE_CHANGED';

export interface ApplicationEventDetail {
    INSTANCE_LAUNCHED: {
        instance: Instance;
        state: InstanceState;
    };

    INSTANCE_STATE_CHANGED: {
        instance: Instance;
        state: InstanceState;
    };
}

export interface ApplicationEventSubscriptionData {
    type: ApplicationEventType;
    detail: ApplicationEventDetail[ApplicationEventType];
}

export type ApplicationEventHandler = (data: ApplicationEventSubscriptionData['detail']) => void;

export interface ApplicationEventsContextData {
    registerHandler: <T extends ApplicationEventType, K = ApplicationEventDetail[T]>(
        type: T,
        handler: (detail: K) => void,
    ) => string;
    unregisterHandlerById: (id: string) => void;
    unregisterHandlersByType: (type: ApplicationEventType) => void;
    unregisterAllHandlers: () => void;
}
