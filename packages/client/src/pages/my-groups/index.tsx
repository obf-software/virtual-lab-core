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
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import React, { useEffect, useState } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { MyGroupsTable } from './table';
import { Paginator } from '../../components/paginator';
import { useMyGroupsContext } from '../../contexts/my-groups/hook';

const RESULTS_PER_PAGE = 10;

export const MyGroupsPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const myGroupsContext = useMyGroupsContext();
    const [activePage, setActivePage] = useState<number>(1);

    useEffect(() => {
        setActiveMenuItem('MY_GROUPS');

        if (myGroupsContext.isLoading === false) {
            myGroupsContext.loadMyGroupsPage(1, RESULTS_PER_PAGE).catch(console.error);
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
                        <Heading color='gray.800'>Meus Grupos</Heading>

                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {`${myGroupsContext.numberOfResults} grupos encontrados`}
                        </Text>
                    </VStack>

                    <IconButton
                        aria-label='Recarregar'
                        variant={'outline'}
                        colorScheme='blue'
                        isLoading={myGroupsContext.isLoading}
                        onClick={() => {
                            myGroupsContext
                                .loadMyGroupsPage(activePage, RESULTS_PER_PAGE)
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

                <MyGroupsTable />

                <Paginator
                    activePage={activePage}
                    totalPages={myGroupsContext.numberOfPages}
                    onPageChange={(page) => {
                        setActivePage(page);
                        myGroupsContext
                            .loadMyGroupsPage(page, RESULTS_PER_PAGE)
                            .catch(console.error);
                    }}
                />
            </Container>
        </Box>
    );
};
