import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api/service';

export const useSearchGroups = (props: { textQuery: string }) => {
    const searchGroupsQuery = useQuery({
        queryKey: ['searchGroups', props.textQuery],
        queryFn: async () => {
            if (props.textQuery.length < 1) return Promise.resolve([]);
            const response = await api.searchGroups(props.textQuery);
            if (response.error !== undefined) throw new Error(response.error);
            return response.data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 20,
        refetchOnWindowFocus: false,
    });

    return {
        searchGroupsQuery,
    };
};
