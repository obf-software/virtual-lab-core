import { useContext } from 'react';
import { MenuContext } from './context';
import { MenuContextData } from './protocol';

export const useMenuContext = (): MenuContextData => useContext(MenuContext);
