import { useMutation } from '@tanstack/react-query';
import * as api from '../services/api';
import { queryClient } from '../services/query-client';
import { Instance, SeekPaginated } from '../services/api-protocols';

export const useInstanceOperations = () => {
    const turnInstanceOn = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.turnInstanceOn({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.setQueriesData<SeekPaginated<Instance>>(
                { queryKey: ['instances'] },
                (currentData) => {
                    if (!currentData) return;

                    const newData = { ...currentData };

                    const instanceIndex = newData.data.findIndex(
                        (instance) => instance.id === variables.instanceId,
                    );

                    if (instanceIndex === -1) return;

                    newData.data[instanceIndex] = {
                        ...newData.data[instanceIndex],
                        state: data.state,
                    };

                    return newData;
                },
            );
        },
    });

    const turnInstanceOff = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.turnInstanceOff({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.setQueriesData<SeekPaginated<Instance>>(
                { queryKey: ['instances'] },
                (currentData) => {
                    if (!currentData) return;

                    const newData = { ...currentData };

                    const instanceIndex = newData.data.findIndex(
                        (instance) => instance.id === variables.instanceId,
                    );

                    if (instanceIndex === -1) return;

                    newData.data[instanceIndex] = {
                        ...newData.data[instanceIndex],
                        state: data.state,
                    };

                    return newData;
                },
            );
        },
    });

    const rebootInstance = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.rebootInstance({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
        },
    });

    const deleteInstance = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.deleteInstance({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['instances'] });
        },
    });

    return {
        turnInstanceOn,
        turnInstanceOff,
        rebootInstance,
        deleteInstance,
    };
};
