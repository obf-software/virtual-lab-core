import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getInstanceTemplate } from '../services/api';

export const useInstanceTemplates = (props: { instanceTemplateId: string }) => {
    const instanceTemplateQuery = useQuery({
        queryKey: ['instance-template', props.instanceTemplateId],
        queryFn: async () => {
            const response = await getInstanceTemplate({
                instanceTemplateId: props.instanceTemplateId,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return {
        instanceTemplateQuery,
    };
};
