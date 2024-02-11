import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listUsers } from '../services/api';

export const useUsers = (props: {
    groupId?: string;
    orderBy: 'creationDate' | 'lastUpdateDate' | 'lastSignInDate' | 'name';
    order: 'asc' | 'desc';
    textQuery?: string;
    page: number;
    resultsPerPage: number;
}) => {
    const usersQuery = useQuery({
        queryKey: [
            `users`,
            props.groupId,
            props.orderBy,
            props.order,
            props.textQuery,
            props.page,
            props.resultsPerPage,
        ],
        queryFn: async () => {
            const response = await listUsers({
                groupId: props.groupId,
                orderBy: props.orderBy,
                order: props.order,
                textQuery: props.textQuery,
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

    return { usersQuery };
};
