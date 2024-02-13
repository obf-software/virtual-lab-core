import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as api from '../services/api';

export const useInstances = (props: {
    ownerId?: string;
    orderBy?: 'creationDate' | 'lastConnectionDate' | 'alphabetical';
    order?: 'asc' | 'desc';
    page: number;
    resultsPerPage: number;
    textSearch?: string;
}) => {
    const instancesQuery = useQuery({
        queryKey: [
            'instances',
            props.ownerId,
            props.orderBy,
            props.order,
            props.page,
            props.resultsPerPage,
        ],
        queryFn: async () => {
            const response = await api.listInstances({
                ownerId: props.ownerId,
                orderBy: props.orderBy ?? 'creationDate',
                order: props.order ?? 'desc',
                page: props.page,
                resultsPerPage: props.resultsPerPage,
                textSearch: props.textSearch,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return {
        instancesQuery,
    };
};
