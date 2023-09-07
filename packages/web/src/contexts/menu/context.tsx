import { createContext } from 'react';
import { MenuContextData } from './data';

export const MenuContext = createContext<MenuContextData>({} as MenuContextData);
