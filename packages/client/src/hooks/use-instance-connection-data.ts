import { useQuery } from '@tanstack/react-query';
import * as api from '../services/api';

export const useInstanceConnectionData = (props: { instanceId: string }) => {
    const getInstanceConnection = useQuery({
        queryKey: ['instance-connection', props.instanceId],
        queryFn: async () => {
            const response = await api.getInstanceConnection({ instanceId: props.instanceId });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        retry: false,
        enabled: false,
        refetchOnWindowFocus: false,
    });

    return {
        getInstanceConnection,
    };
};
