import { useQuery } from '@tanstack/react-query';
import { SeekPaginationInput } from '../services/api/protocols';
import { listGroupUsers } from '../services/api/service';

export const useGroupsUsers = (groupId: number, pagination: SeekPaginationInput) => {
    const groupUsersQuery = useQuery({
        queryKey: [`groupUsers_${groupId}`, pagination.page],
        queryFn: async () => {
            if (groupId === undefined) throw new Error('groupId is undefined');
            const { data, error } = await listGroupUsers(groupId, pagination);
            if (error !== undefined) throw new Error(error);
            return data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return { groupUsersQuery };
};
