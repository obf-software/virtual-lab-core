/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import 'dayjs/locale/pt-br';
import {
    TabPanel,
    Input,
    useToast,
    FormControl,
    FormLabel,
    FormHelperText,
} from '@chakra-ui/react';
import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as api from '../../../services/api';
import { Role, User } from '../../../services/api-protocols';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../services/query-client';
import { getErrorMessage, roleToDisplayString } from '../../../services/helpers';
import { Select } from 'chakra-react-select';
import { useAuthSessionData } from '../../../hooks/use-auth-session-data';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UserDetailsModalInfoTabPanelProps {
    user: User;
}

export const UserDetailsModalInfoTabPanel: React.FC<UserDetailsModalInfoTabPanelProps> = ({
    user,
}) => {
    const authSessionData = useAuthSessionData();
    const toast = useToast();
    const updateUserRoleMutation = useMutation({
        mutationFn: async (mut: { userId: string | 'me'; role: Role }) => {
            const response = await api.updateUserRole({ userId: mut.userId, role: mut.role });
            if (!response.success) throw new Error(response.error);
            return { mut, data: response.data };
        },
        onSuccess: ({ mut }) => {
            queryClient.invalidateQueries({ queryKey: ['user', mut.userId] }).catch(console.error);
            queryClient.invalidateQueries({ queryKey: ['users'] }).catch(console.error);
        },
        onError: (error) => {
            toast({
                title: 'Erro ao atualizar usuário',
                description: getErrorMessage(error),
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        },
    });

    return (
        <TabPanel>
            <FormControl
                mt={'2%'}
                isReadOnly
            >
                <FormLabel htmlFor='role'>Usuário</FormLabel>
                <Input
                    id='role'
                    value={user.username}
                />
            </FormControl>

            <FormControl
                mt={'2%'}
                isRequired={user.id !== authSessionData?.userId}
                isReadOnly={user.id === authSessionData?.userId}
            >
                <FormLabel htmlFor='role'>Cargo</FormLabel>
                <Select
                    id='role'
                    isLoading={updateUserRoleMutation.isPending}
                    options={(['ADMIN', 'USER'] as Role[]).map((role) => ({
                        label: roleToDisplayString(role),
                        value: role as Role,
                    }))}
                    value={{
                        label: roleToDisplayString(user.role),
                        value: user.role,
                    }}
                    onChange={(option) => {
                        if (option !== null) {
                            updateUserRoleMutation.mutate({
                                userId: user.id,
                                role: option.value,
                            });
                        }
                    }}
                />
                <FormHelperText>
                    {user.id === authSessionData?.userId
                        ? 'Você não pode alterar seu próprio cargo'
                        : ''}
                </FormHelperText>
            </FormControl>

            <FormControl
                mt={'2%'}
                isReadOnly
            >
                <FormLabel htmlFor='role'>Data de criação</FormLabel>
                <Input
                    id='role'
                    value={`${dayjs(user.createdAt).format('DD/MM/YYYY')} (${dayjs(
                        user.createdAt,
                    ).fromNow()})`}
                />
            </FormControl>

            <FormControl
                mt={'2%'}
                isReadOnly
            >
                <FormLabel htmlFor='role'>Data da última atualização</FormLabel>
                <Input
                    id='role'
                    value={`${dayjs(user.updatedAt).format('DD/MM/YYYY')} (${dayjs(
                        user.updatedAt,
                    ).fromNow()})`}
                />
            </FormControl>

            <FormControl
                mt={'2%'}
                isReadOnly
            >
                <FormLabel htmlFor='role'>Data do último acesso</FormLabel>
                <Input
                    id='role'
                    value={
                        user.lastLoginAt !== null
                            ? `${dayjs(user.lastLoginAt).format('DD/MM/YYYY')} (${dayjs(
                                  user.lastLoginAt,
                              ).fromNow()})`
                            : 'Nunca'
                    }
                />
            </FormControl>
        </TabPanel>
    );
};
