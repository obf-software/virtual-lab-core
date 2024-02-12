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
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { InstanceCard } from '../../components/instance-card';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { useInstances } from '../../hooks/use-instances';
import { usePaginationSearchParam } from '../../hooks/use-pagination-search-param';
import { useNavigate } from 'react-router-dom';

export const InstancesPage: React.FC = () => {
    const { page, setParams } = usePaginationSearchParam();
    const { instancesQuery } = useInstances({
        ownerId: 'me',
        resultsPerPage: 20,
        orderBy: 'lastConnectionDate',
        order: 'desc',
        page,
    });
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

    return (
        <Box>
            <Container maxW={'6xl'}>
                <Stack
                    pb={10}
                    maxW={'6xl'}
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 5, md: 10 }}
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
                            {numberOfInstances === 0 ? 'Nenhuma instância encontrada' : null}
                            {numberOfInstances === 1
                                ? `${numberOfInstances} instância encontrada`
                                : null}
                            {numberOfInstances > 1
                                ? `${numberOfInstances} instâncias encontradas`
                                : null}
                        </Text>
                    </VStack>

                    <ButtonGroup>
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
                            variant={'solid'}
                            colorScheme='blue'
                            leftIcon={<FiPlus />}
                            onClick={() => {
                                navigate('/new-instance');
                            }}
                        >
                            Nova instância
                        </Button>
                    </ButtonGroup>
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

                {instances.map((instance) => (
                    <Box
                        pb={10}
                        key={`instance-${instance.virtualId}`}
                    >
                        <InstanceCard instance={instance} />
                    </Box>
                ))}

                {instances.length > 0 && !instancesQuery.isLoading ? (
                    <Paginator
                        activePage={page}
                        totalPages={numberOfPages}
                        onPageChange={(selectedPage) => {
                            setParams({ page: selectedPage });
                        }}
                    />
                ) : null}
            </Container>
        </Box>
    );
};
