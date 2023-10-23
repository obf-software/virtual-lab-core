import React, { PropsWithChildren, useState } from 'react';
import { MyGroupsContext } from './context';
import { Group } from '../../services/api/protocols';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { parseSessionData } from '../../services/helpers';
import { useToast } from '@chakra-ui/react';
import { listUserGroups } from '../../services/api/service';

export const MyGroupsProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { user } = useAuthenticator((context) => [context.user]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [numberOfPages, setNumberOfPages] = useState<number>(0);
    const [numberOfResults, setNumberOfResults] = useState<number>(0);
    const [myGroups, setMyGroups] = useState<Group[]>([]);
    const toast = useToast();

    const loadMyGroupsPage = async (page: number, resultsPerPage: number) => {
        try {
            setIsLoading(true);

            const { userId } = parseSessionData(user);

            const response = await listUserGroups(userId ?? 'me', { page, resultsPerPage });
            if (response.error !== undefined) throw new Error(response.error);
            const { data, numberOfPages, numberOfResults } = response.data;

            setMyGroups(data);
            setNumberOfPages(numberOfPages);
            setNumberOfResults(numberOfResults);
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            const reason = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({
                colorScheme: 'red',
                title: 'Erro ao listar grupos',
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
        <MyGroupsContext.Provider
            value={{
                loadMyGroupsPage,
                numberOfPages,
                numberOfResults,
                isLoading,
                myGroups,
            }}
        >
            {children}
        </MyGroupsContext.Provider>
    );
};
