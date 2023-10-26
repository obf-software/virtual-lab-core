import { useQuery } from '@tanstack/react-query';
import { getUser } from '../services/api/service';

export const useUser = (userId: number | 'me') => {
    const userQuery = useQuery({
        queryKey: ['user', userId],
        queryFn: async () => {
            const response = await getUser(userId);
            if (response.error !== undefined) throw new Error(response.error);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });

    return userQuery;
};
