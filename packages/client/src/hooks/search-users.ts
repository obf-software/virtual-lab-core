import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api/service';

export const useSearchUsers = (props: { textQuery: string }) => {
    const searchUsersQuery = useQuery({
        queryKey: ['searchUsers', props.textQuery],
        queryFn: async () => {
            if (props.textQuery.length < 1) return Promise.resolve([]);
            const response = await api.searchUsers(props.textQuery);
            if (response.error !== undefined) throw new Error(response.error);
            return response.data;
        },
        staleTime: 1000 * 20,
        refetchOnWindowFocus: false,
    });

    return {
        searchUsersQuery,
    };
};
