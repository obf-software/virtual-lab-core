import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Stack,
    InputGroup,
    Input,
    InputLeftElement,
    InputRightElement,
    IconButton,
} from '@chakra-ui/react';
import { UsersTable } from './table';
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUsers } from '../../hooks/users';

const RESULTS_PER_PAGE = 20;

export const UsersPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const { usersQuery } = useUsers({ resultsPerPage: RESULTS_PER_PAGE, page });
    const { setActiveMenuItem } = useMenuContext(); // TODO: Convert context to zustand hook.

    React.useEffect(() => {
        if (usersQuery.data?.numberOfPages && page > usersQuery.data?.numberOfPages) {
            setSearchParams({ page: '1' });
        } else {
            setSearchParams({ page: page.toString() });
        }

        setActiveMenuItem('ADMIN_USERS');
    }, [page, usersQuery.data?.numberOfPages]);

    const numberOfUsers = usersQuery.data?.numberOfResults ?? 0;

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
                        <Heading color='gray.800'>Usuários</Heading>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {numberOfUsers === 0 ? 'Nenhum usuário encontrado' : null}
                            {numberOfUsers === 1 ? `${numberOfUsers} usuário encontrado` : null}
                            {numberOfUsers > 1 ? `${numberOfUsers} usuários encontrados` : null}
                        </Text>
                    </VStack>

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
                </Stack>

                <Stack pb={5}>
                    <InputGroup boxShadow={'sm'}>
                        <InputLeftElement pointerEvents='none'>
                            <FiSearch color='gray.300' />
                        </InputLeftElement>
                        <Input
                            type='text'
                            placeholder='Pesquisar'
                            bgColor={'white'}
                            disabled
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label='Limpar pesquisa'
                                variant={'ghost'}
                                size={'sm'}
                                icon={<FiX />}
                                isDisabled
                            />
                        </InputRightElement>
                    </InputGroup>
                </Stack>

                <UsersTable
                    resultsPerPage={RESULTS_PER_PAGE}
                    page={page}
                />

                <Paginator
                    activePage={page}
                    totalPages={usersQuery.data?.numberOfPages ?? 0}
                    onPageChange={(page) => {
                        navigate(`?page=${page}`);
                    }}
                />
            </Container>
        </Box>
    );
};
