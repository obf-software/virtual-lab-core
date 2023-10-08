import { useMutation, useQuery } from '@tanstack/react-query';
import * as api from '../../services/api/service';

export const useInstances = (props: {
    userId: number | 'me';
    resultsPerPage: number;
    page: number;
}) => {
    const instancesQuery = useQuery({
        queryKey: ['instances', props.page],
        queryFn: async () => {
            const response = await api.listUserInstances(props.userId, {
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
        instancesQuery,
    };
};
