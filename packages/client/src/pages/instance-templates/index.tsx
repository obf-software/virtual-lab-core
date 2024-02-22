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
import { usePaginationSearchParam } from '../../hooks/use-pagination-search-param';
import { useInstanceTemplates } from '../../hooks/use-instance-templates';
import { useInstanceTemplateOperations } from '../../hooks/use-instance-template-operations';
import { InstanceTemplateCard } from '../../components/instance-template-card';
import { SearchBar } from '../../components/search-bar';
import { FilterButton } from '../../components/filter-button';

export const InstanceTemplatesPage: React.FC = () => {
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
        createdBy: undefined,
        textSearch,
        resultsPerPage,
        orderBy,
        order,
        page,
    });
    const { createInstanceTemplate, deleteInstanceTemplate, updateInstanceTemplate } =
        useInstanceTemplateOperations();
    const { setActiveMenuItem } = useMenuContext();

    const instanceTemplates = instanceTemplatesQuery.data?.data ?? [];
    const numberOfInstanceTemplates = instanceTemplatesQuery.data?.numberOfResults ?? 0;
    const numberOfPages = instanceTemplatesQuery.data?.numberOfPages ?? 0;

    React.useEffect(() => {
        if (numberOfPages > 0 && page > numberOfPages) {
            setParams({ page: 1 });
        }

        setActiveMenuItem('ADMIN_INSTANCE_TEMPLATES');
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
                            <Heading color='gray.800'>Templates</Heading>
                            <Text
                                fontSize='md'
                                color='gray.600'
                            >
                                {numberOfInstanceTemplates === 0 && 'Nenhum resultado'}
                                {numberOfInstanceTemplates === 1 &&
                                    `${numberOfInstanceTemplates} resultado`}
                                {numberOfInstanceTemplates > 1 &&
                                    `${numberOfInstanceTemplates} resultados`}
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
                                    /**
                                     * Avoid setting the textSearch to an empty string
                                     */
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

                            <Button
                                minW={{ md: '10rem' }}
                                maxW={{ md: '10rem' }}
                                variant={'solid'}
                                colorScheme='blue'
                                leftIcon={<FiPlus />}
                                onClick={() => {
                                    console.log('Novo template');
                                }}
                            >
                                Novo template
                            </Button>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>

                {instanceTemplates.length === 0 && !instanceTemplatesQuery.isLoading ? (
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
                ) : null}

                {instanceTemplatesQuery.isLoading ? (
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

                {instanceTemplates.length > 0 && !instanceTemplatesQuery.isLoading && (
                    <Box>
                        <Fade in>
                            <SimpleGrid
                                pb={10}
                                columns={{ base: 1, md: 3 }}
                                spacing={6}
                            >
                                {instanceTemplates.map((instanceTemplate) => (
                                    <InstanceTemplateCard
                                        key={`list-templates-instance-template-${instanceTemplate.id}-card`}
                                        instanceTemplate={instanceTemplate}
                                        isLoading={
                                            createInstanceTemplate.isPending ||
                                            deleteInstanceTemplate.isPending ||
                                            updateInstanceTemplate.isPending
                                        }
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
