import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listInstanceTypes } from '../services/api';

export const useInstanceTypes = () => {
    const instanceTypesQuery = useQuery({
        queryKey: ['instance-types'],
        queryFn: async () => {
            const response = await listInstanceTypes();
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });

    return {
        instanceTypesQuery,
    };
};
