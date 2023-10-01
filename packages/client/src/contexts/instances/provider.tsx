import React, { PropsWithChildren, useState } from 'react';
import { InstancesContext } from './context';
import { Instance } from '../../services/api/protocols';
import { useToast } from '@chakra-ui/react';
import { listUserInstances } from '../../services/api/service';
import { useNotificationsContext } from '../notifications/hook';

export const InstancesProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [activePage, setActivePage] = useState<number>(1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [numberOfPages, setNumberOfPages] = useState<number>(0);
    const [numberOfResults, setNumberOfResults] = useState<number>(0);
    const [instances, setInstances] = useState<Instance[]>([]);
    const [lastLoadAt, setLastLoadAt] = useState<Date>();
    const { registerHandler, unregisterHandlerById } = useNotificationsContext();
    const toast = useToast();

    React.useEffect(() => {
        const ec2InstanceStateChangedHandlerId = registerHandler(
            'EC2_INSTANCE_STATE_CHANGED',
            (data) => {
                console.log('EC2_INSTANCE_STATE_CHANGED', data);

                setInstances((currentInstances) => {
                    return currentInstances.map((instance) => {
                        if (instance.id === data.id) {
                            return {
                                ...instance,
                                state: data.state,
                            };
                        }

                        return instance;
                    });
                });
            },
        );

        const ec2InstanceProvisionedHandlerId = registerHandler(
            'EC2_INSTANCE_PROVISIONED',
            (data) => {
                console.log('EC2_INSTANCE_PROVISIONED', data);

                setInstances((currentInstances) => {
                    return currentInstances.map((instance) => {
                        if (instance.id === data.instance.id) {
                            return {
                                ...instance,
                                ...data.instance,
                            };
                        }

                        return instance;
                    });
                });
            },
        );

        return () => {
            unregisterHandlerById(ec2InstanceStateChangedHandlerId);
            unregisterHandlerById(ec2InstanceProvisionedHandlerId);
        };
    }, []);

    const loadInstancesPage = async (page: number, resultsPerPage: number) => {
        try {
            setIsLoading(true);

            const response = await listUserInstances(undefined, { page, resultsPerPage });
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

    return (
        <InstancesContext.Provider
            value={{
                loadInstancesPage,
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
