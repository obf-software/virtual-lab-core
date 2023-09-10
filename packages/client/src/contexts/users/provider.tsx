import React, { PropsWithChildren, useState } from 'react';
import { UsersContext } from './context';
import { User } from '../../services/api/protocols';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { parseSessionData } from '../../services/helpers';
import { useToast } from '@chakra-ui/react';
import { listUsers } from '../../services/api/service';

export const UsersProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { user } = useAuthenticator((context) => [context.user]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [numberOfPages, setNumberOfPages] = useState<number>(0);
    const [numberOfResults, setNumberOfResults] = useState<number>(0);
    const [users, setUsers] = useState<User[]>([]);
    const toast = useToast();

    const loadUsersPage = async (page: number, resultsPerPage: number) => {
        try {
            setIsLoading(true);

            const { idToken } = parseSessionData(user);
            if (idToken === undefined) throw new Error('idToken is undefined');

            const response = await listUsers(idToken, { page, resultsPerPage });
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

    return (
        <UsersContext.Provider
            value={{
                loadUsersPage,
                numberOfPages,
                numberOfResults,
                isLoading,
                users,
            }}
        >
            {children}
        </UsersContext.Provider>
    );
};
