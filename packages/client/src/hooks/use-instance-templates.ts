import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listInstanceTemplates } from '../services/api';

export const useInstanceTemplates = (props: {
    createdBy?: string;
    textSearch?: string;
    orderBy?: 'creationDate' | 'lastUpdateDate' | 'alphabetical';
    order?: 'asc' | 'desc';
    page: number;
    resultsPerPage: number;
}) => {
    const instanceTemplatesQuery = useQuery({
        queryKey: [
            'instance-templates',
            props.createdBy,
            props.textSearch,
            props.orderBy,
            props.order,
            props.page,
            props.resultsPerPage,
        ],
        queryFn: async () => {
            const response = await listInstanceTemplates({
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

    return {
        instanceTemplatesQuery,
    };
};
