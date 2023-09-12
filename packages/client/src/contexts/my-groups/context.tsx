import { createContext } from 'react';
import { MyGroupsContextData } from './protocol';

export const MyGroupsContext = createContext<MyGroupsContextData>({} as MyGroupsContextData);
