import { createContext } from 'react';
import { ApplicationEventsContextData } from './protocol';

export const ApplicationEventsContext = createContext<ApplicationEventsContextData>(
    {} as ApplicationEventsContextData,
);
