import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listProducts } from '../services/api';

export const useProducts = () => {
    const productsQuery = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await listProducts();
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });

    return {
        productsQuery,
    };
};
