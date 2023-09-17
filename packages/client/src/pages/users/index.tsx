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
import React, { useEffect, useState } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { useUsersContext } from '../../contexts/users/hook';
import { Paginator } from '../../components/paginator';

const RESULTS_PER_PAGE = 20;

export const UsersPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const usersContext = useUsersContext();
    const [activePage, setActivePage] = useState<number>(1);

    useEffect(() => {
        setActiveMenuItem('ADMIN_USERS');

        if (usersContext.isLoading === false) {
            usersContext.loadUsersPage(1, RESULTS_PER_PAGE).catch(console.error);
        }
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
                            {`${usersContext.numberOfResults} usuários encontrados`}
                        </Text>
                    </VStack>

                    <IconButton
                        aria-label='Recarregar'
                        variant={'outline'}
                        colorScheme='blue'
                        isLoading={usersContext.isLoading}
                        onClick={() => {
                            usersContext
                                .loadUsersPage(activePage, RESULTS_PER_PAGE)
                                .catch(console.error);
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
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label='Limpar pesquisa'
                                variant={'ghost'}
                                size={'sm'}
                                icon={<FiX />}
                            />
                        </InputRightElement>
                    </InputGroup>
                </Stack>

                <UsersTable />

                <Paginator
                    activePage={activePage}
                    totalPages={usersContext.numberOfPages}
                    onPageChange={(page) => {
                        setActivePage(page);
                        usersContext.loadUsersPage(page, RESULTS_PER_PAGE).catch(console.error);
                    }}
                />
            </Container>
        </Box>
    );
};
