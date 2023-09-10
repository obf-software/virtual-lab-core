import { useContext } from 'react';
import { UsersContextData } from './protocol';
import { UsersContext } from './context';

export const useUsersContext = (): UsersContextData => useContext(UsersContext);
