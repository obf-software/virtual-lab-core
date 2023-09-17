import React, { PropsWithChildren, useState } from 'react';
import { InstancesContext } from './context';
import { Instance } from '../../services/api/protocols';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { parseSessionData } from '../../services/helpers';
import { useToast } from '@chakra-ui/react';
import { listUserInstances } from '../../services/api/service';

export const InstancesProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { user } = useAuthenticator((context) => [context.user]);
    const [activePage, setActivePage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [numberOfPages, setNumberOfPages] = useState<number>(0);
    const [numberOfResults, setNumberOfResults] = useState<number>(0);
    const [instances, setInstances] = useState<Instance[]>([]);
    const [lastLoadAt, setLastLoadAt] = useState<Date>();
    const toast = useToast();

    const loadInstancesPage = async (page: number, resultsPerPage: number) => {
        try {
            setIsLoading(true);

            const { idToken } = parseSessionData(user);
            if (idToken === undefined) throw new Error('idToken is undefined');

            const response = await listUserInstances(idToken, undefined, { page, resultsPerPage });
            if (response.error !== undefined) throw new Error(response.error);
            const { data, numberOfPages, numberOfResults } = response.data;

            setInstances(data);
            setNumberOfPages(numberOfPages);
            setNumberOfResults(numberOfResults);
            setIsLoading(false);
            setActivePage(page);
            setLastLoadAt(new Date());
        } catch (error) {
            setIsLoading(false);
            setActivePage(page);
            setLastLoadAt(new Date());
            const reason = error instanceof Error ? error.message : 'Erro desconhecido';
            toast({
                colorScheme: 'red',
                title: 'Erro ao listar instâncias',
                description: reason,
                isClosable: true,
                duration: 5000,
                status: 'error',
                variant: 'left-accent',
                position: 'bottom-left',
            });
        }
    };

    const getConnectionString = async (instanceId: number) => {
        return Promise.resolve(
            'token=eyJpdiI6IjF0anVHU1hHUzBHdXhnK3lIVGdGcEE9PSIsInZhbHVlIjoibUJIRDhZOHJqWWk2Z0t2cU5zQmJFcEV6NjUvQjJyK25zRUxtVlFuYmZzQ3ZRZGhhazZ5T0FTWHRsWktablBOWHJ0Ym5TUlJTY2VKdTcvK28rTDVGdVl3Qi9SQzVydVBYS2U5SE1yNEJldDN5N3VvSFZyUTg2ZlQxY2x2WmlqY0xTRHE4US9mMTFycERLNURtdWRYVWNyMC83VUc5MnphSHZHcVBQc3Irdi9wWUtibTZpUVY1ejlMSG5vdDFKbnphcUxBQWJjMnJZTDlpOERxS2dyTjBUZi9jblZmamM4d2RwQW91Z0JJaFhtZz0ifQ==',
        );
    };

    return (
        <InstancesContext.Provider
            value={{
                loadInstancesPage,
                getConnectionString,
                activePage,
                numberOfPages,
                numberOfResults,
                isLoading,
                instances,
                lastLoadAt,
            }}
        >
            {children}
        </InstancesContext.Provider>
    );
};