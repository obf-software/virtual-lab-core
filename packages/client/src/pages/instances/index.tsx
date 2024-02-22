import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Button,
    Stack,
    ButtonGroup,
    IconButton,
    Spinner,
    Tooltip,
    SimpleGrid,
    Fade,
    SlideFade,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { useInstances } from '../../hooks/use-instances';
import { usePaginationSearchParam } from '../../hooks/use-pagination-search-param';
import { useNavigate } from 'react-router-dom';
import { useApplicationEventsContext } from '../../contexts/application-events/hook';
import { queryClient } from '../../services/query-client';
import { Instance, SeekPaginated } from '../../services/api-protocols';
import { FilterButton } from '../../components/filter-button';
import { SearchBar } from '../../components/search-bar';
import { InstancesPageCard } from './card';

export const InstancesPage: React.FC = () => {
    const { page, resultsPerPage, order, orderBy, setParams } = usePaginationSearchParam({
        allowedOrderByValues: ['creationDate', 'lastConnectionDate', 'alphabetical'],
        defaultOrderBy: 'creationDate',
        allowedOrderValues: ['asc', 'desc'],
        defaultOrder: 'desc',
        defaultPage: 1,
        defaultResultsPerPage: 10,
    });
    const [textSearch, setTextSearch] = React.useState<string>();
    const { instancesQuery } = useInstances({
        ownerId: 'me',
        textSearch,
        resultsPerPage,
        orderBy,
        order,
        page,
    });
    const { registerHandler, unregisterHandlerById } = useApplicationEventsContext();
    const { setActiveMenuItem } = useMenuContext();
    const navigate = useNavigate();

    const instances = instancesQuery.data?.data ?? [];
    const numberOfInstances = instancesQuery.data?.numberOfResults ?? 0;
    const numberOfPages = instancesQuery.data?.numberOfPages ?? 0;

    React.useEffect(() => {
        if (numberOfPages > 0 && page > numberOfPages) {
            setParams({ page: 1 });
        }

        setActiveMenuItem('INSTANCES');
    }, [page, numberOfPages]);

    React.useEffect(() => {
        const instanceStateChangedHandlerId = registerHandler(
            'INSTANCE_STATE_CHANGED',
            (detail) => {
                queryClient.setQueriesData<SeekPaginated<Instance>>(
                    { queryKey: ['instances'] },
                    (currentData) => {
                        if (!currentData) return currentData;

                        return {
                            ...currentData,
                            data: currentData.data.map((instance) => {
                                if (instance.id === detail.instance.id) {
                                    console.log('Updating instance state', detail.state);
                                    return {
                                        ...instance,
                                        state: detail.state,
                                    };
                                }
                                return instance;
                            }),
                        };
                    },
                );
            },
        );

        const instanceLaunchedHandlerId = registerHandler('INSTANCE_LAUNCHED', (detail) => {
            queryClient.setQueriesData<SeekPaginated<Instance>>(
                { queryKey: ['instances'] },
                (currentData) => {
                    if (!currentData) return currentData;

                    return {
                        ...currentData,
                        data: currentData.data.map((instance) => {
                            if (instance.id === detail.instance.id) {
                                console.log('Updating instance state', detail.state);
                                return {
                                    ...instance,
                                    ...detail.instance,
                                    state: detail.state,
                                };
                            }
                            return instance;
                        }),
                    };
                },
            );
        });

        return () => {
            unregisterHandlerById(instanceStateChangedHandlerId);
            unregisterHandlerById(instanceLaunchedHandlerId);
        };
    }, []);

    return (
        <Box>
            <Container maxW={'6xl'}>
                <Stack
                    pb={10}
                    maxW={'6xl'}
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 4, md: 10 }}
                >
                    <SlideFade
                        in
                        offsetX={'-20px'}
                        offsetY={0}
                    >
                        <VStack
                            spacing={0}
                            align={{ base: 'center', md: 'initial' }}
                        >
                            <Heading color='gray.800'>Instâncias</Heading>
                            <Text
                                fontSize='md'
                                color='gray.600'
                            >
                                {numberOfInstances === 0 ? 'Nenhum resultado' : null}
                                {numberOfInstances === 1 ? `${numberOfInstances} resultado` : null}
                                {numberOfInstances > 1 ? `${numberOfInstances} resultados` : null}
                            </Text>
                        </VStack>
                    </SlideFade>

                    <SlideFade
                        in
                        offsetX={'20px'}
                        offsetY={0}
                    >
                        <ButtonGroup>
                            <FilterButton
                                hidden={instancesQuery.isLoading}
                                filters={{
                                    orderBy: {
                                        label: 'Ordenar por',
                                        selectedValue: orderBy ?? 'creationDate',
                                        values: [
                                            { label: 'Data de criação', value: 'creationDate' },
                                            {
                                                label: 'Última conexão',
                                                value: 'lastConnectionDate',
                                            },
                                            { label: 'Alfabético', value: 'alphabetical' },
                                        ],
                                    },
                                    order: {
                                        label: 'Ordem',
                                        selectedValue: order ?? 'desc',
                                        values: [
                                            { label: 'Crescente', value: 'asc' },
                                            { label: 'Decrescente', value: 'desc' },
                                        ],
                                    },
                                    resultsPerPage: {
                                        label: 'Resultados por página',
                                        selectedValue: resultsPerPage.toString(),
                                        values: [
                                            { label: '10', value: '10' },
                                            { label: '20', value: '20' },
                                            { label: '30', value: '30' },
                                        ],
                                    },
                                }}
                                onFiltersChange={(filters) => {
                                    setParams({
                                        orderBy: filters.orderBy.selectedValue as 'creationDate',
                                        order: filters.order.selectedValue as 'asc',
                                        resultsPerPage: parseInt(
                                            filters.resultsPerPage.selectedValue,
                                        ),
                                    });
                                }}
                            />

                            <SearchBar
                                debounceMilliseconds={500}
                                isHidden={instancesQuery.isLoading}
                                isLoading={instancesQuery.isFetching}
                                onTextChange={(text) => {
                                    setTextSearch(text || undefined);
                                }}
                            />

                            <Tooltip label='Recarregar'>
                                <IconButton
                                    aria-label='Recarregar'
                                    variant={'outline'}
                                    colorScheme='blue'
                                    hidden={instancesQuery.isLoading}
                                    isLoading={instancesQuery.isFetching}
                                    onClick={() => {
                                        instancesQuery.refetch().catch(console.error);
                                    }}
                                >
                                    <FiRefreshCw />
                                </IconButton>
                            </Tooltip>

                            <Button
                                minW={{ md: '10rem' }}
                                maxW={{ md: '10rem' }}
                                variant={'solid'}
                                colorScheme='blue'
                                leftIcon={<FiPlus />}
                                onClick={() => {
                                    navigate('/instances/new');
                                }}
                            >
                                Nova instância
                            </Button>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>

                {instances.length === 0 && !instancesQuery.isLoading ? (
                    <Box
                        height={'50vh'}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <Text
                            align={'center'}
                            fontSize='xl'
                            color='gray.600'
                        >
                            Nenhuma instância encontrada
                        </Text>
                    </Box>
                ) : null}

                {instancesQuery.isLoading ? (
                    <Box
                        height={'50vh'}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <Spinner
                            size={'xl'}
                            speed={'1s'}
                            thickness={'4px'}
                            color={'blue.500'}
                            emptyColor={'gray.200'}
                        />
                    </Box>
                ) : null}

                {instances.length > 0 && !instancesQuery.isLoading && (
                    <Box>
                        <Fade in>
                            <SimpleGrid
                                pb={10}
                                columns={{ base: 1, md: 2 }}
                                spacing={10}
                            >
                                {instances.map((instance) => (
                                    <InstancesPageCard
                                        key={`instances-page-instance-${instance.id}-card`}
                                        instance={instance}
                                        isDisabled={instancesQuery.isFetching}
                                    />
                                ))}
                            </SimpleGrid>

                            <Paginator
                                activePage={page}
                                totalPages={numberOfPages}
                                onPageChange={(selectedPage) => {
                                    setParams({ page: selectedPage });
                                }}
                            />
                        </Fade>
                    </Box>
                )}
            </Container>
        </Box>
    );
};
