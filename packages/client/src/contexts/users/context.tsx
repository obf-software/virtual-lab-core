import { createContext } from 'react';
import { UsersContextData } from './protocol';

export const UsersContext = createContext<UsersContextData>({} as UsersContextData);
