import { useContext } from 'react';
import { MyGroupsContextData } from './protocol';
import { MyGroupsContext } from './context';

export const useMyGroupsContext = (): MyGroupsContextData => useContext(MyGroupsContext);
