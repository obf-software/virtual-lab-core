import React, { PropsWithChildren, useState } from 'react';
import { UsersContext } from './context';
import { User, UserRole } from '../../services/api/protocols';
import { useToast } from '@chakra-ui/react';
import * as apiService from '../../services/api/service';

export const UsersProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const [numberOfPages, setNumberOfPages] = useState<number>(0);
    const [numberOfResults, setNumberOfResults] = useState<number>(0);
    const [users, setUsers] = useState<User[]>([]);
    const toast = useToast();

    const loadUsersPage = async (page: number, resultsPerPage: number) => {
        try {
            setIsLoading(true);

            const response = await apiService.listUsers({ page, resultsPerPage });
            if (response.error !== undefined) throw new Error(response.error);
            const { data, numberOfPages, numberOfResults } = response.data;

            setUsers(data);
            setNumberOfPages(numberOfPages);
            setNumberOfResults(numberOfResults);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            const reason = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({
                colorScheme: 'red',
                title: 'Erro ao listar usuários',
                description: reason,
                isClosable: true,
                duration: 5000,
                status: 'error',
                variant: 'left-accent',
                position: 'bottom-left',
            });
        }
    };

    const updateUserRole = async (userId: string, role: keyof typeof UserRole) => {
        try {
            setIsUpdating(true);

            const response = await apiService.updateUserRole(userId, role);
            if (response.error !== undefined) throw new Error(response.error);

            setUsers((currentUsers) => {
                const updatedUsers = currentUsers.map((currentUser) => {
                    if (currentUser.id === userId) {
                        return { ...currentUser, role };
                    }

                    return currentUser;
                });

                return updatedUsers;
            });

            setIsUpdating(false);
        } catch (error) {
            setIsUpdating(false);
            const reason = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({
                colorScheme: 'red',
                title: 'Erro ao atualizar usuário',
                description: reason,
                isClosable: true,
                duration: 5000,
                status: 'error',
                variant: 'left-accent',
                position: 'bottom-left',
            });
        }
    };

    return (
        <UsersContext.Provider
            value={{
                updateUserRole,
                loadUsersPage,
                numberOfPages,
                numberOfResults,
                isLoading,
                isUpdating,
                users,
            }}
        >
            {children}
        </UsersContext.Provider>
    );
};
