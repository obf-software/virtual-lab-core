import { createContext } from 'react';
import { NotificationsContextData } from './protocol';

export const NotificationsContext = createContext<NotificationsContextData>(
    {} as NotificationsContextData,
);
