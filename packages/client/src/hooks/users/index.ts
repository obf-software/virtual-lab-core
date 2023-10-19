import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api/service';

export const useUsers = (props: { resultsPerPage: number; page: number }) => {
    const usersQuery = useQuery({
        queryKey: ['users', props.page],
        queryFn: async () => {
            const response = await api.listUsers({
                resultsPerPage: props.resultsPerPage,
                page: props.page,
            });
            if (response.error !== undefined) throw new Error(response.error);
            return response.data;
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return {
        usersQuery,
    };
};
