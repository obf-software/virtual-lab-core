import { useMutation } from '@tanstack/react-query';
import * as api from '../services/api';
import { queryClient } from '../services/query-client';
import { Instance, SeekPaginated } from '../services/api-protocols';
import { useNavigate } from 'react-router-dom';

export const useInstanceOperations = () => {
    const navigate = useNavigate();

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

    const launchInstance = useMutation({
        mutationFn: async (mut: {
            ownerId: string;
            templateId: string;
            instanceType: string;
            description: string;
            canHibernate: boolean;
            name: string;
        }) => {
            const response = await api.launchInstance({
                ownerId: mut.ownerId,
                templateId: mut.templateId,
                instanceType: mut.instanceType,
                description: mut.description,
                canHibernate: mut.canHibernate,
                name: mut.name,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['instances'] });
            navigate('/instances');
        },
    });

    const createTemplate = useMutation({
        mutationFn: async (mut: {
            instanceId: string;
            name: string;
            description: string;
            storageInGb?: number;
        }) => {
            const response = await api.createInstanceTemplateFromInstance({
                instanceId: mut.instanceId,
                name: mut.name,
                description: mut.description,
                storageInGb: mut.storageInGb,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['instance-templates'] });
        },
    });

    return {
        turnInstanceOn,
        turnInstanceOff,
        rebootInstance,
        deleteInstance,
        launchInstance,
        createTemplate,
    };
};
