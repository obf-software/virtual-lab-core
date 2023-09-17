import { createContext } from 'react';
import { InstancesContextData } from './protocol';

export const InstancesContext = createContext<InstancesContextData>({} as InstancesContextData);
