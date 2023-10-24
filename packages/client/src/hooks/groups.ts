import { useQuery } from '@tanstack/react-query';
import { SeekPaginationInput } from '../services/api/protocols';
import { listGroups } from '../services/api/service';

export const useGroups = (pagination: SeekPaginationInput) => {
    const groupsQuery = useQuery({
        queryKey: ['groups', pagination.page],
        queryFn: async () => {
            const { data, error } = await listGroups(pagination);
            if (error !== undefined) throw new Error(error);
            return data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return { groupsQuery };
};
