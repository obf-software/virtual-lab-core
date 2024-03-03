import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Stack,
    ButtonGroup,
    IconButton,
    Spinner,
    Tooltip,
    Fade,
    SimpleGrid,
    SlideFade,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { useInstanceTemplates } from '../../hooks/use-instance-templates';
import { usePaginationSearchParam } from '../../hooks/use-pagination-search-param';
import { Paginator } from '../../components/paginator';
import { SearchBar } from '../../components/search-bar';
import { FilterButton } from '../../components/filter-button';
import { NewInstancePageCard } from './card';
import { useNavigate } from 'react-router-dom';

export const NewInstancePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const { page, resultsPerPage, order, orderBy, setParams } = usePaginationSearchParam({
        allowedOrderByValues: ['creationDate', 'lastUpdateDate', 'alphabetical'],
        defaultOrderBy: 'creationDate',
        allowedOrderValues: ['asc', 'desc'],
        defaultOrder: 'desc',
        defaultPage: 1,
        defaultResultsPerPage: 10,
    });
    const [textSearch, setTextSearch] = React.useState<string>();
    const { instanceTemplatesQuery } = useInstanceTemplates({
        page,
        resultsPerPage,
        order,
        orderBy,
        textSearch,
    });
    const navigate = useNavigate();

    const instanceTemplates = instanceTemplatesQuery.data?.data ?? [];
    const numberOfPages = instanceTemplatesQuery.data?.numberOfPages ?? 0;
    const numberOfResults = instanceTemplatesQuery.data?.numberOfResults ?? 0;

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
                        <Breadcrumb separator={<Heading>/</Heading>}>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    onClick={() => {
                                        navigate('/instances');
                                    }}
                                >
                                    <Heading color='gray.800'>Instâncias</Heading>
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <SlideFade
                                in
                                offsetX={'-20px'}
                                offsetY={0}
                            >
                                <BreadcrumbItem>
                                    <BreadcrumbLink isCurrentPage>
                                        <Heading color='gray.800'>Nova</Heading>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </SlideFade>
                        </Breadcrumb>

                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {numberOfResults === 0 && 'Nenhum resultado'}
                            {numberOfResults === 1 && '1 resultado'}
                            {numberOfResults > 1 && `${numberOfResults} resultados`}
                        </Text>
                    </VStack>

                    <SlideFade
                        in
                        offsetX={'20px'}
                        offsetY={0}
                    >
                        <ButtonGroup>
                            <FilterButton
                                hidden={instanceTemplatesQuery.isLoading}
                                filters={{
                                    orderBy: {
                                        label: 'Ordenar por',
                                        selectedValue: orderBy ?? 'creationDate',
                                        values: [
                                            { label: 'Data de criação', value: 'creationDate' },
                                            {
                                                label: 'Data de atualização',
                                                value: 'lastUpdateDate',
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
                                            {
                                                label: '10',
                                                value: '10',
                                            },
                                            {
                                                label: '20',
                                                value: '20',
                                            },
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
                                isHidden={instanceTemplatesQuery.isLoading}
                                isLoading={instanceTemplatesQuery.isFetching}
                                onTextChange={(text) => {
                                    setTextSearch(text || undefined);
                                }}
                            />

                            <Tooltip label='Recarregar'>
                                <IconButton
                                    aria-label='Recarregar'
                                    variant={'outline'}
                                    colorScheme='blue'
                                    hidden={instanceTemplatesQuery.isLoading}
                                    isLoading={instanceTemplatesQuery.isFetching}
                                    onClick={() => {
                                        instanceTemplatesQuery.refetch().catch(console.error);
                                    }}
                                >
                                    <FiRefreshCw />
                                </IconButton>
                            </Tooltip>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>

                {numberOfResults === 0 && !instanceTemplatesQuery.isLoading && (
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
                            Nenhum template encontrado
                        </Text>
                    </Box>
                )}

                {instanceTemplatesQuery.isLoading && (
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
                )}

                {numberOfResults > 0 && !instanceTemplatesQuery.isLoading && (
                    <Box>
                        <Fade in>
                            <SimpleGrid
                                pb={10}
                                columns={{ base: 1, md: 3 }}
                                spacing={6}
                            >
                                {instanceTemplates.map((template) => (
                                    <NewInstancePageCard
                                        key={`instance-template-${template.id}-card`}
                                        instanceTemplate={template}
                                        isLoading={false}
                                        isDisabled={instanceTemplatesQuery.isFetching}
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
