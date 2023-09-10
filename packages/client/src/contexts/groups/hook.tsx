import { useContext } from 'react';
import { GroupsContextData } from './protocol';
import { GroupsContext } from './context';

export const useGroupsContext = (): GroupsContextData => useContext(GroupsContext);
