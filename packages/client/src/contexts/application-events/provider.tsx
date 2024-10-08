import React, { PropsWithChildren, useEffect, useState } from 'react';
import { ApplicationEventsContext } from './context';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/api';
import { v4 } from 'uuid';
import {
    ApplicationEventDetail,
    ApplicationEventHandler,
    ApplicationEventSubscriptionData,
    ApplicationEventType,
    applicationEventSubscriptionQuery,
} from './protocol';

export const ApplicationEventsProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { user } = useAuthenticator((context) => [context.user]);
    const [, setSubscription] = useState<unknown>();
    const [handlers, setHandlers] = useState<
        Record<ApplicationEventType, Record<string, ApplicationEventHandler> | undefined>
    >({
        INSTANCE_LAUNCHED: {},
        INSTANCE_STATE_CHANGED: {},
    });

    useEffect(() => {
        if (user.username === undefined) {
            console.log(
                '[ApplicationEventsProvider]: User is not authenticated. Skipping subscription setup.',
            );
            return;
        }

        const client = generateClient();
        const newSubscription = client
            .graphql({
                query: applicationEventSubscriptionQuery,
                variables: { name: user.username },
            })
            .subscribe({
                next(value) {
                    const data = JSON.parse(
                        value.data.subscribe.data,
                    ) as ApplicationEventSubscriptionData;

                    console.log(
                        `[ApplicationEventsProvider]: Received application event ${data.type}`,
                        data,
                    );

                    const handlersForType = Object.entries(handlers?.[data.type] ?? {});

                    handlersForType.forEach(([handlerId, handler]) => {
                        console.log(
                            `[ApplicationEventsProvider]: Executing handler "${handlerId}" (${data.type})`,
                        );
                        handler(data.detail);
                    });
                },
                error(error) {
                    console.error(
                        '[ApplicationEventsProvider]: Error receiving application event',
                        error,
                    );
                },
                complete() {
                    console.log('[ApplicationEventsProvider]: Subscription completed');
                },
            });

        setSubscription((currentSubscription: typeof newSubscription | undefined) => {
            currentSubscription?.unsubscribe();
            return newSubscription;
        });

        return () => {
            newSubscription.unsubscribe();
        };
    }, [handlers, user]);

    const registerHandler = React.useCallback(
        <T extends ApplicationEventType, K = ApplicationEventDetail[T]>(
            type: T,
            handler: (detail: K) => void,
        ): string => {
            const id = v4();

            setHandlers((currentHandlers) => {
                return {
                    ...currentHandlers,
                    [type]: {
                        ...currentHandlers[type],
                        [id]: handler,
                    },
                };
            });

            console.log(`[ApplicationEventsProvider]: Registered handler "${id}" (${type})`);
            return id;
        },
        [setHandlers],
    );

    const unregisterHandlerById = React.useCallback(
        (id: string) => {
            setHandlers((currentHandlers) => {
                const newHandlers = { ...currentHandlers };
                Object.entries(newHandlers).forEach(([type, handlers]) => {
                    if (handlers?.[id] !== undefined) {
                        console.log(
                            `[ApplicationEventsProvider]: Unregistered handler "${id}" (${type})`,
                        );
                        delete handlers[id];
                    }
                });
                return newHandlers;
            });
        },
        [setHandlers],
    );

    const unregisterHandlersByType = React.useCallback(
        (type: ApplicationEventType) => {
            setHandlers((currentHandlers) => {
                Object.entries(currentHandlers[type] ?? {}).forEach(([handlerId]) => {
                    console.log(
                        `[ApplicationEventsProvider]: Unregistered handler "${handlerId}" (${type})`,
                    );
                });

                return {
                    ...currentHandlers,
                    [type]: undefined,
                };
            });
        },
        [setHandlers],
    );

    const unregisterAllHandlers = React.useCallback(() => {
        setHandlers({
            INSTANCE_LAUNCHED: undefined,
            INSTANCE_STATE_CHANGED: undefined,
        });

        console.log('[ApplicationEventsProvider]: Unregistered all handlers');
    }, [setHandlers]);

    return (
        <ApplicationEventsContext.Provider
            value={{
                registerHandler,
                unregisterHandlerById,
                unregisterHandlersByType,
                unregisterAllHandlers,
            }}
        >
            {children}
        </ApplicationEventsContext.Provider>
    );
};
