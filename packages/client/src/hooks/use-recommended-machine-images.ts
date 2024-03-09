import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listRecommendedMachineImages } from '../services/api';

export const useRecommendedMachineImages = () => {
    const recommendedMachineImagesQuery = useQuery({
        queryKey: ['instance-types'],
        queryFn: async () => {
            const response = await listRecommendedMachineImages();
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    });

    return {
        recommendedMachineImagesQuery,
    };
};
