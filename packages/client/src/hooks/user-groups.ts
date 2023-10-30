import { useQuery } from '@tanstack/react-query';
import { SeekPaginationInput } from '../services/api/protocols';
import { listUserGroups } from '../services/api/service';

export const useUserGroups = (userId: number | 'me', pagination: SeekPaginationInput) => {
    const userGroupsQuery = useQuery({
        queryKey: [`userGroups_${userId}`, pagination.page],
        queryFn: async () => {
            const { data, error } = await listUserGroups(userId, pagination);
            if (error !== undefined) throw new Error(error);
            return data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return { userGroupsQuery };
};
