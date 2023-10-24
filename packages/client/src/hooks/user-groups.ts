import { useQuery } from '@tanstack/react-query';
import { SeekPaginationInput } from '../services/api/protocols';
import { listUserGroups } from '../services/api/service';

export const useUserGroups = (userId: string, pagination: SeekPaginationInput) => {
    const userGroupsQuery = useQuery({
        queryKey: ['userGroups', userId, pagination.page],
        queryFn: async () => {
            const { data, error } = await listUserGroups(
                userId === 'me' ? 'me' : Number(userId),
                pagination,
            );
            if (error !== undefined) throw new Error(error);
            return data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return { userGroupsQuery };
};
