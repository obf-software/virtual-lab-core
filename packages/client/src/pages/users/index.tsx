import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Stack,
    IconButton,
    Tooltip,
    SlideFade,
    ButtonGroup,
    Fade,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { useUsers } from '../../hooks/use-users';
import { usePaginationSearchParam } from '../../hooks/use-pagination-search-param';
import { FilterButton } from '../../components/filter-button';
import { SearchBar } from '../../components/search-bar';
import { UsersPageTable } from './table';

export const UsersPage: React.FC = () => {
    const { page, orderBy, order, resultsPerPage, setParams } = usePaginationSearchParam({
        allowedOrderByValues: ['creationDate', 'alphabetical', 'lastUpdateDate', 'lastLoginDate'],
        defaultOrderBy: 'creationDate',
        allowedOrderValues: ['asc', 'desc'],
        defaultOrder: 'desc',
        defaultPage: 1,
        defaultResultsPerPage: 30,
    });
    const [textSearch, setTextSearch] = React.useState<string>();
    const { usersQuery } = useUsers({
        textSearch,
        resultsPerPage,
        page,
        orderBy,
        order,
    });
    const { setActiveMenuItem } = useMenuContext();

    const users = usersQuery.data?.data ?? [];
    const numberOfUsers = usersQuery.data?.numberOfResults ?? 0;
    const numberOfPages = usersQuery.data?.numberOfPages ?? 0;

    React.useEffect(() => {
        if (numberOfPages > 0 && page > numberOfPages) {
            setParams({ page: 1 });
        }

        setActiveMenuItem('ADMIN_USERS');
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
                    <SlideFade
                        in
                        offsetX={'-20px'}
                        offsetY={0}
                    >
                        <VStack
                            spacing={0}
                            align={{ base: 'center', md: 'initial' }}
                        >
                            <Heading color='gray.800'>Usuários</Heading>
                            <Text
                                fontSize='md'
                                color='gray.600'
                            >
                                {numberOfUsers === 0 && 'Nenhum resultado'}
                                {numberOfUsers === 1 && `${numberOfUsers} resultado`}
                                {numberOfUsers > 1 && `${numberOfUsers} resultados`}
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
                                hidden={usersQuery.isLoading}
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
                                            {
                                                label: 'Data de último login',
                                                value: 'lastLoginDate',
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
                                            { label: '30', value: '30' },
                                            { label: '60', value: '60' },
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
                                isHidden={usersQuery.isLoading}
                                isLoading={usersQuery.isFetching}
                                onTextChange={(text) => {
                                    setTextSearch(text || undefined);
                                }}
                            />

                            <Tooltip label='Recarregar'>
                                <IconButton
                                    aria-label='Recarregar'
                                    variant={'outline'}
                                    colorScheme='blue'
                                    hidden={usersQuery.isLoading}
                                    isLoading={usersQuery.isFetching}
                                    onClick={() => {
                                        usersQuery.refetch().catch(console.error);
                                    }}
                                >
                                    <FiRefreshCw />
                                </IconButton>
                            </Tooltip>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>

                <Fade in>
                    <Stack spacing={6}>
                        <UsersPageTable
                            users={users}
                            error={usersQuery.error?.message}
                            isLoading={usersQuery.isLoading}
                            isDisabled={usersQuery.isFetching}
                        />

                        <Paginator
                            activePage={page}
                            totalPages={numberOfPages}
                            onPageChange={(selectedPage) => {
                                setParams({ page: selectedPage });
                            }}
                        />
                    </Stack>
                </Fade>
            </Container>
        </Box>
    );
};
