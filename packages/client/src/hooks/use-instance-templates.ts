import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listInstanceTemplates } from '../services/api';

export const useInstanceTemplates = () => {
    const instanceTemplatesQuery = useQuery({
        queryKey: ['instance-templates'],
        queryFn: async () => {
            const response = await listInstanceTemplates();
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return {
        instanceTemplatesQuery,
    };
};
