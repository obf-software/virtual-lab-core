import { createContext } from 'react';
import { ProductsContextData } from './protocol';

export const ProductsContext = createContext<ProductsContextData>({} as ProductsContextData);
