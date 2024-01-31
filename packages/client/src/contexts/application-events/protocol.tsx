import { Instance, VirtualInstanceState } from '../../services/api/protocols';

export const applicationEventSubscriptionQuery = `#graphql subscription Subscribe($name: String!) {
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
        state: VirtualInstanceState;
    };

    INSTANCE_STATE_CHANGED: {
        instance: Instance;
        state: VirtualInstanceState;
    };
}

export interface ApplicationEventSubscriptionData {
    type: ApplicationEventType;
    detail: ApplicationEventDetail[ApplicationEventType];
}

export type ApplicationEventHandler = (data: ApplicationEventSubscriptionData) => void;

export interface ApplicationEventsContextData {
    registerHandler: <T extends ApplicationEventType, K = ApplicationEventDetail[T]>(
        type: T,
        handler: (detail: K) => void,
    ) => string;
    unregisterHandlerById: (id: string) => void;
    unregisterHandlersByType: (type: ApplicationEventType) => void;
    unregisterAllHandlers: () => void;
}
