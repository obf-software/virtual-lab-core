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
import * as api from '../../../services/api/service';
import { Role, User } from '../../../services/api/protocols';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../services/query/service';
import { getErrorMessage, parseSessionData, roleToDisplayString } from '../../../services/helpers';
import { Select } from 'chakra-react-select';
import { useAuthenticator } from '@aws-amplify/ui-react';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UserDetailsModalInfoTabPanelProps {
    user: User;
}

export const UserDetailsModalInfoTabPanel: React.FC<UserDetailsModalInfoTabPanelProps> = ({
    user,
}) => {
    const { user: amplifyUser } = useAuthenticator((context) => [context.user]);
    const { userId } = parseSessionData(amplifyUser);
    const toast = useToast();
    const updateUserRoleMutation = useMutation({
        mutationFn: async (mut: { userId: number | 'me'; role: keyof typeof Role }) => {
            const { data, error } = await api.updateUserRole(user.id, mut.role);
            if (error !== undefined) throw new Error(error);
            return { mut, data };
        },
        onSuccess: ({ mut }) => {
            queryClient.invalidateQueries(['user', mut.userId]).catch(console.error);
            queryClient.invalidateQueries(['users']).catch(console.error);
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
                isRequired={user.id !== userId}
                isReadOnly={user.id === userId}
            >
                <FormLabel htmlFor='role'>Cargo</FormLabel>
                <Select
                    id='role'
                    isLoading={updateUserRoleMutation.isLoading}
                    options={Object.keys(Role).map((role) => ({
                        label: roleToDisplayString(role as keyof typeof Role),
                        value: role as keyof typeof Role,
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
                    {user.id === userId ? 'Você não pode alterar seu próprio cargo' : ''}
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
