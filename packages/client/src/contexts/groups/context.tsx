import { createContext } from 'react';
import { GroupsContextData } from './protocol';

export const GroupsContext = createContext<GroupsContextData>({} as GroupsContextData);
