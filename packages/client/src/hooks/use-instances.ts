/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as api from '../services/api';

export const useInstances = (props: {
    ownerId?: string | 'me';
    orderBy: 'creationDate' | 'lastConnectionDate' | 'name';
    order: 'asc' | 'desc';
    page: number;
    resultsPerPage: number;
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

    return {
        instancesQuery,
    };
};
