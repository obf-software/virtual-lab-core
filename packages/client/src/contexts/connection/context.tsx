import { createContext } from 'react';
import { ConnectionContextData } from './protocol';

export const ConnectionContext = createContext<ConnectionContextData>({} as ConnectionContextData);
