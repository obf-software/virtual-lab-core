import { useQuery } from '@tanstack/react-query';
import { listUserProducts } from '../services/api/service';
import React from 'react';
import { useToast } from '@chakra-ui/react';
import { getErrorMessage } from '../services/helpers';

export const useUserProducts = (props: { userId: number | 'me' }) => {
    const toast = useToast();

    const userProductsQuery = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await listUserProducts(props.userId);
            if (error !== undefined) throw new Error(error);
            return data;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const refetch = React.useCallback(() => {
        userProductsQuery.refetch().catch(console.error);
    }, [userProductsQuery]);

    React.useEffect(() => {
        let toastId: string | number | undefined = undefined;
        if (userProductsQuery.isError) {
            toastId = toast({
                title: `Erro ao buscar produtos`,
                description: getErrorMessage(userProductsQuery.error),
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }

        return () => {
            if (toastId !== undefined) {
                toast.close(toastId);
            }
        };
    }, [userProductsQuery.isError, toast]);

    return {
        products: userProductsQuery.data ?? [],
        numberOfProducts: userProductsQuery.data?.length ?? 0,
        isLoading: userProductsQuery.isLoading,
        isFetching: userProductsQuery.isFetching,
        refetch,
    };
};
