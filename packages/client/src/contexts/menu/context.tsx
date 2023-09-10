import { createContext } from 'react';
import { MenuContextData } from './protocol';

export const MenuContext = createContext<MenuContextData>({} as MenuContextData);
