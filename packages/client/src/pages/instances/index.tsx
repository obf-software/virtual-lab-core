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
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { InstanceCard } from './instance-card';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useInstances } from '../../hooks/instances';

const RESULTS_PER_PAGE = 20;

export const InstancesPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const { instancesQuery } = useInstances({
        userId: 'me',
        resultsPerPage: RESULTS_PER_PAGE,
        page,
    });
    const { setActiveMenuItem } = useMenuContext();

    React.useEffect(() => {
        if (instancesQuery.data?.numberOfPages && page > instancesQuery.data?.numberOfPages) {
            setSearchParams({ page: '1' });
        } else {
            setSearchParams({ page: page.toString() });
        }

        setActiveMenuItem('INSTANCES');
    }, [page, instancesQuery.data?.numberOfPages]);

    const numberOfInstances = instancesQuery.data?.numberOfResults ?? 0;

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

                {instancesQuery.data?.data.length === 0 && !instancesQuery.isLoading ? (
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

                {instancesQuery.data?.data.map((instance) => (
                    <Box
                        pb={10}
                        key={`instance-${instance.logicalId}`}
                    >
                        <InstanceCard instance={instance} />
                    </Box>
                ))}

                {instancesQuery.data &&
                instancesQuery.data.numberOfPages > 0 &&
                !instancesQuery.isLoading ? (
                    <Paginator
                        activePage={page}
                        totalPages={instancesQuery.data.numberOfPages ?? 0}
                        onPageChange={(page) => {
                            navigate(`?page=${page}`);
                        }}
                    />
                ) : null}
            </Container>
        </Box>
    );
};
