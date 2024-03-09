import { useMutation } from '@tanstack/react-query';
import * as api from '../services/api';
import { InstanceTemplate, SeekPaginated } from '../services/api-protocols';
import { queryClient } from '../services/query-client';

export const useInstanceTemplateOperations = () => {
    const createInstanceTemplate = useMutation({
        mutationFn: async (mut: {
            name: string;
            description: string;
            machineImageId: string;
            storageInGb?: number;
        }) => {
            const response = await api.createInstanceTemplate({
                name: mut.name,
                description: mut.description,
                machineImageId: mut.machineImageId,
                storageInGb: mut.storageInGb,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: () => {
            queryClient
                .invalidateQueries({
                    queryKey: ['instance-templates'],
                })
                .catch(console.error);
        },
    });

    const deleteInstanceTemplate = useMutation({
        mutationFn: async (mut: { instanceTemplateId: string }) => {
            const response = await api.deleteInstanceTemplate({
                instanceTemplateId: mut.instanceTemplateId,
            });
            if (!response.success) throw new Error(response.error);
        },
        onSuccess: (_, variables) => {
            queryClient.setQueriesData<SeekPaginated<InstanceTemplate>>(
                { queryKey: ['instance-templates'] },
                (currentData) => {
                    if (!currentData) return;

                    const newData = { ...currentData };

                    newData.data = newData.data.filter(
                        (instanceTemplate) => instanceTemplate.id !== variables.instanceTemplateId,
                    );

                    return newData;
                },
            );
        },
    });

    const updateInstanceTemplate = useMutation({
        mutationFn: async (mut: {
            instanceTemplateId: string;
            name: string;
            description: string;
        }) => {
            const response = await api.updateInstanceTemplate({
                instanceTemplateId: mut.instanceTemplateId,
                name: mut.name,
                description: mut.description,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.setQueriesData<SeekPaginated<InstanceTemplate>>(
                { queryKey: ['instance-templates'] },
                (currentData) => {
                    if (!currentData) return;

                    const newData = { ...currentData };

                    const instanceTemplateIndex = newData.data.findIndex(
                        (instanceTemplate) => instanceTemplate.id === variables.instanceTemplateId,
                    );

                    if (instanceTemplateIndex === -1) return;

                    newData.data[instanceTemplateIndex] = {
                        ...newData.data[instanceTemplateIndex],
                        name: data.name,
                        description: data.description,
                    };

                    return newData;
                },
            );
        },
    });

    return {
        createInstanceTemplate,
        deleteInstanceTemplate,
        updateInstanceTemplate,
    };
};
