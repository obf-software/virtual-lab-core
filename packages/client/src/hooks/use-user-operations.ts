import { useMutation } from '@tanstack/react-query';
import * as api from '../services/api';
import { queryClient } from '../services/query-client';
import { Role, User } from '../services/api-protocols';

export const useUserOperations = () => {
    const updateRole = useMutation({
        mutationFn: async (mut: { userId: string; role: Role }) => {
            const response = await api.updateUserRole({
                userId: mut.userId,
                role: mut.role,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (user) => {
            queryClient.setQueryData<User>(['user', user.id], user);
            queryClient.invalidateQueries({ queryKey: ['users'] }).catch(console.error);
        },
    });

    const updateQuotas = useMutation({
        mutationFn: async (mut: {
            userId: string;
            allowedInstanceTypes?: string[];
            canLaunchInstanceWithHibernation?: boolean;
            maxInstances?: number;
        }) => {
            const response = await api.updateUserQuotas({
                userId: mut.userId,
                allowedInstanceTypes: mut.allowedInstanceTypes,
                canLaunchInstanceWithHibernation: mut.canLaunchInstanceWithHibernation,
                maxInstances: mut.maxInstances,
            });
            if (!response.success) throw new Error(response.error);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData<User>(['user', data.id], data);
            queryClient.invalidateQueries({ queryKey: ['users'] }).catch(console.error);
        },
    });

    return {
        updateRole,
        updateQuotas,
    };
};
