import { useMutation } from '@tanstack/react-query';
import * as api from '../services/api';

export const useInstanceOperations = () => {
    const turnInstanceOn = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.turnInstanceOn({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
            return { instanceId: mut.instanceId, state: response.data.state };
        },
    });

    const turnInstanceOff = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.turnInstanceOff({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
            return { instanceId: mut.instanceId, state: response.data.state };
        },
    });

    const rebootInstance = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.rebootInstance({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
            return { instanceId: mut.instanceId };
        },
    });

    const deleteInstance = useMutation({
        mutationFn: async (mut: { instanceId: string }) => {
            const response = await api.deleteInstance({ instanceId: mut.instanceId });
            if (!response.success) throw new Error(response.error);
            return { instanceId: mut.instanceId };
        },
    });

    return {
        turnInstanceOn,
        turnInstanceOff,
        rebootInstance,
        deleteInstance,
    };
};
