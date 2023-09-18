import React, { PropsWithChildren, useState } from 'react';
import { GroupsContext } from './context';
import { Group } from '../../services/api/protocols';
import { useToast } from '@chakra-ui/react';
import { listGroups } from '../../services/api/service';

export const GroupsProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [numberOfPages, setNumberOfPages] = useState<number>(0);
    const [numberOfResults, setNumberOfResults] = useState<number>(0);
    const [groups, setGroups] = useState<Group[]>([]);
    const toast = useToast();

    const loadGroupsPage = async (page: number, resultsPerPage: number) => {
        try {
            setIsLoading(true);

            const response = await listGroups({ page, resultsPerPage });
            if (response.error !== undefined) throw new Error(response.error);
            const { data, numberOfPages, numberOfResults } = response.data;

            setGroups(data);
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
        <GroupsContext.Provider
            value={{
                loadGroupsPage,
                numberOfPages,
                numberOfResults,
                isLoading,
                groups,
            }}
        >
            {children}
        </GroupsContext.Provider>
    );
};
