import { useContext } from 'react';
import { ConnectionContextData } from './protocol';
import { ConnectionContext } from './context';

export const useConnectionContext = (): ConnectionContextData => useContext(ConnectionContext);
