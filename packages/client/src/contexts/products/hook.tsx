import { useContext } from 'react';
import { ProductsContextData } from './protocol';
import { ProductsContext } from './context';

export const useProductsContext = (): ProductsContextData => useContext(ProductsContext);
