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
    useDisclosure,
} from '@chakra-ui/react';
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { useUsers } from '../../hooks/users';
import { User } from '../../services/api/protocols';
import { UserDetailsModal } from '../../components/user-details-modal';
import { UsersTable } from '../../components/users-table';
import { usePaginationSearchParam } from '../../hooks/pagination-search-param';

export const UsersPage: React.FC = () => {
    const { page, setPage } = usePaginationSearchParam();
    const { usersQuery } = useUsers({ resultsPerPage: 20, page });
    const { setActiveMenuItem } = useMenuContext(); // TODO: Convert context to zustand hook.
    const [selectedUser, setSelectedUser] = React.useState<User>();
    const userDetailsModalDisclosure = useDisclosure();

    const users = usersQuery.data?.data ?? [];
    const numberOfUsers = usersQuery.data?.numberOfResults ?? 0;
    const numberOfPages = usersQuery.data?.numberOfPages ?? 0;

    React.useEffect(() => {
        if (numberOfPages > 0 && page > numberOfPages) {
            setPage(1);
        }

        setActiveMenuItem('ADMIN_USERS');
    }, [page, numberOfPages]);

    return (
        <Box>
            <UserDetailsModal
                user={selectedUser ?? ({} as User)}
                isOpen={userDetailsModalDisclosure.isOpen}
                onClose={() => {
                    userDetailsModalDisclosure.onClose();
                    setSelectedUser(undefined);
                }}
            />

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

                <Stack spacing={6}>
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

                    <UsersTable
                        users={users}
                        isLoading={usersQuery.isLoading}
                        onSelect={(user) => {
                            setSelectedUser(user);
                            userDetailsModalDisclosure.onOpen();
                        }}
                    />

                    <Paginator
                        activePage={page}
                        totalPages={numberOfPages}
                        onPageChange={(selectedPage) => {
                            setPage(selectedPage);
                        }}
                    />
                </Stack>
            </Container>
        </Box>
    );
};
