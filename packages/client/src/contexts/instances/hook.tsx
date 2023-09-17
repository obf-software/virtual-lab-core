import { useContext } from 'react';
import { InstancesContextData } from './protocol';
import { InstancesContext } from './context';

export const useInstancesContext = (): InstancesContextData => useContext(InstancesContext);
