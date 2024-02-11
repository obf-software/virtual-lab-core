/* eslint-disable @typescript-eslint/no-redundant-type-constituents */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getUser } from '../services/api';

export const useUser = (props: { userId: string | 'me' }) => {
    const userQuery = useQuery({
        queryKey: ['user', props.userId],
        queryFn: async () => {
            const response = await getUser({
                userId: props.userId,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return {
        userQuery,
    };
};
