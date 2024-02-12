import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listGroups } from '../services/api';

export const useGroups = (props: {
    userId?: string;
    createdBy?: string;
    textSearch?: string;
    orderBy: 'creationDate' | 'lastUpdateDate' | 'alphabetical';
    order: 'asc' | 'desc';
    page: number;
    resultsPerPage: number;
}) => {
    const groupsQuery = useQuery({
        queryKey: [
            'groups',
            props.userId,
            props.createdBy,
            props.textSearch,
            props.orderBy,
            props.order,
            props.page,
            props.resultsPerPage,
        ],
        queryFn: async () => {
            const response = await listGroups({
                userId: props.userId,
                createdBy: props.createdBy,
                textSearch: props.textSearch,
                orderBy: props.orderBy,
                order: props.order,
                page: props.page,
                resultsPerPage: props.resultsPerPage,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return { groupsQuery };
};
