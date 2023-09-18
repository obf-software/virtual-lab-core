import React, { PropsWithChildren, useEffect, useState } from 'react';
import { NotificationsContext } from './context';
import { useAuthenticator } from '@aws-amplify/ui-react';
import {
    NotificationData,
    NotificationPayload,
    NotificationType,
    NotificationTypeMap,
    ReadableNotification,
} from './protocol';
import type { ZenObservable } from 'zen-observable-ts';
import { API, graphqlOperation } from 'aws-amplify';
import { useToast } from '@chakra-ui/react';
import { v4 } from 'uuid';

export const NotificationsProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { user } = useAuthenticator((context) => [context.user]);
    const [, setSubscription] = useState<ZenObservable.Subscription>();
    const [handlers, setHandlers] =
        useState<Record<string, Record<string, (data: unknown) => void> | undefined>>();
    const [notifications, setNotifications] = useState<ReadableNotification[]>([]);
    const toast = useToast();

    useEffect(() => {
        if (user.username === undefined) {
            console.log('Not subscribing to notifications, user is not logged in');
            return;
        }

        const query = `subscription Subscribe($name: String!) { subscribe(name: $name) { data name } }`;

        const newSubscription = (
            API.graphql(graphqlOperation(query, { name: user.username })) as Exclude<
                ReturnType<typeof API.graphql>,
                Promise<unknown>
            >
        ).subscribe({
            next: (payload: NotificationPayload) => {
                const data = JSON.parse(payload.value.data.subscribe.data) as NotificationData;
                console.log(`Received notification for ${data.type}`, data);

                setNotifications((currentNotifications) => {
                    if (data.type === 'EC2_INSTANCE_STATE_CHANGED') {
                        const typedData = data as NotificationTypeMap['EC2_INSTANCE_STATE_CHANGED'];

                        const newNotification: ReadableNotification = {
                            id: v4(),
                            viewed: false,
                            text: `Instância ${typedData.name} mudou de estado para ${typedData.state}`,
                        };

                        console.log('New notification', newNotification);

                        return [newNotification, ...currentNotifications];
                    }

                    return currentNotifications;
                });

                const handlersForType = Object.entries(handlers?.[data.type] ?? {});

                handlersForType.forEach(([handlerId, handler]) => {
                    console.log(`Calling handler for ${data.type}, id: ${handlerId}`);
                    handler(data);
                });
            },
            error: (error) => {
                const reason = error instanceof Error ? error.message : 'Unknown error';
                console.error('Error receiving notification', reason);
                toast({
                    title: 'Error receiving notification',
                    description: reason,
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                    variant: 'left-accent',
                    position: 'bottom-left',
                });
            },
        });

        setSubscription((currentSubscription) => {
            currentSubscription?.unsubscribe();
            return newSubscription;
        });
    }, [handlers, user.username]);

    const registerHandler = <T extends keyof typeof NotificationType, K = NotificationTypeMap[T]>(
        type: T,
        handler: (data: K) => void,
    ) => {
        const id = v4();
        console.log(`Registering handler for ${type}, id: "${id}"`);
        setHandlers((currentHandlers) => {
            return {
                ...currentHandlers,
                [type]: {
                    ...currentHandlers?.[type],
                    [id]: handler as (data: unknown) => void,
                },
            };
        });
        return id;
    };

    const unregisterHandlerById = (id: string) => {
        console.log(`Unregistering handler with id: ${id}`);

        setHandlers((currentHandlers) => {
            return Object.fromEntries(
                Object.entries(currentHandlers ?? {}).map(([type, handlers]) => {
                    return [
                        type,
                        Object.fromEntries(
                            Object.entries(handlers ?? {}).filter(
                                ([handlerId]) => handlerId !== id,
                            ),
                        ),
                    ];
                }),
            );
        });
    };

    const unregisterHandlerByType = (type: keyof typeof NotificationType) => {
        console.log(`Unregistering handler for ${type}`);

        setHandlers((currentHandlers) => {
            return {
                ...currentHandlers,
                [type]: undefined,
            };
        });
    };

    const unregisterAllHandlers = () => {
        console.log('Unregistering all handlers');

        setHandlers(undefined);
    };

    const markNotificationAsViewed = (id: string) => {
        console.log(`Marking notification with id ${id} as viewed`);

        setNotifications((currentNotifications) => {
            return currentNotifications.map((notification) => ({
                ...notification,
                viewed: notification.id === id ? true : notification.viewed,
            }));
        });
    };

    return (
        <NotificationsContext.Provider
            value={{
                registerHandler,
                unregisterHandlerById,
                unregisterHandlerByType,
                unregisterAllHandlers,
                notifications,
                markNotificationAsViewed,
            }}
        >
            {children}
        </NotificationsContext.Provider>
    );
};