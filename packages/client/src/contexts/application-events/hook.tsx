import { useContext } from 'react';
import { ApplicationEventsContextData } from './protocol';
import { ApplicationEventsContext } from './context';

export const useApplicationEventsContext = (): ApplicationEventsContextData =>
    useContext(ApplicationEventsContext);
