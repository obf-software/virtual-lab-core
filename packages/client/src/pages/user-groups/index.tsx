import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Stack,
    IconButton,
    useDisclosure,
    InputGroup,
    InputLeftElement,
    Input,
    InputRightElement,
} from '@chakra-ui/react';
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { useUserGroups } from '../../hooks/user-groups';
import { GroupsTable } from '../../components/groups-table';
import { Group } from '../../services/api/protocols';
import { GroupDetailsModal } from '../../components/group-details-modal';
import { usePaginationSearchParam } from '../../hooks/pagination-search-param';
import { useUserIdSearchParam } from '../../hooks/user-id-search-param';

export const UserGroupsPage: React.FC = () => {
    const { page, setPage } = usePaginationSearchParam();
    const { userId } = useUserIdSearchParam();
    const { userGroupsQuery } = useUserGroups(userId, { resultsPerPage: 20, page });
    const { setActiveMenuItem } = useMenuContext(); // TODO: Convert context to zustand hook.
    const groupDetailsModalDisclosure = useDisclosure();
    const [selectedGroup, setSelectedGroup] = React.useState<Group>();

    const userGroups = userGroupsQuery.data?.data ?? [];
    const numberOfGroups = userGroupsQuery.data?.numberOfResults ?? 0;
    const numberOfPages = userGroupsQuery.data?.numberOfPages ?? 0;

    React.useEffect(() => {
        if (numberOfPages > 0 && page > numberOfPages) {
            setPage(1);
        }

        if (userId === 'me') {
            setActiveMenuItem('MY_GROUPS');
        }
    }, [page, userId, numberOfPages]);

    return (
        <Box>
            <GroupDetailsModal
                group={selectedGroup ?? ({} as Group)}
                isOpen={groupDetailsModalDisclosure.isOpen}
                onClose={groupDetailsModalDisclosure.onClose}
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
                        <Heading color='gray.800'>
                            {userId === 'me' ? 'Meus Grupos' : `Grupos do usuário ${userId}`}
                        </Heading>

                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {numberOfGroups === 0 ? 'Nenhum grupo encontrado' : null}
                            {numberOfGroups === 1 ? `${numberOfGroups} grupo encontrado` : null}
                            {numberOfGroups > 1 ? `${numberOfGroups} grupos encontrados` : null}
                        </Text>
                    </VStack>

                    <IconButton
                        aria-label='Recarregar'
                        variant={'outline'}
                        colorScheme='blue'
                        hidden={userGroupsQuery.isLoading}
                        isLoading={userGroupsQuery.isFetching}
                        onClick={() => {
                            userGroupsQuery.refetch().catch(console.error);
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

                    <GroupsTable
                        groups={userGroups}
                        isLoading={userGroupsQuery.isLoading}
                        onSelect={(group) => {
                            setSelectedGroup(group);
                            groupDetailsModalDisclosure.onOpen();
                        }}
                    />

                    <Paginator
                        activePage={page}
                        totalPages={userGroupsQuery.data?.numberOfPages ?? 0}
                        onPageChange={(selectedPage) => {
                            setPage(selectedPage);
                        }}
                    />
                </Stack>
            </Container>
        </Box>
    );
};
