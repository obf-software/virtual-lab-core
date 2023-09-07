import { useContext } from 'react';
import { MenuContext } from './context';
import { MenuContextData } from './data';

export const useMenu = (): MenuContextData => useContext(MenuContext);
