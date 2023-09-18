import { useContext } from 'react';
import { NotificationsContextData } from './protocol';
import { NotificationsContext } from './context';

export const useNotificationsContext = (): NotificationsContextData =>
    useContext(NotificationsContext);
