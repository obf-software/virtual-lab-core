import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Button,
    Stack,
    InputGroup,
    Input,
    InputLeftElement,
    InputRightElement,
    IconButton,
    ButtonGroup,
    useDisclosure,
    useToast,
    Tooltip,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { CreateGroupModal } from './create-group-modal';
import { useGroups } from '../../hooks/use-groups';
import { GroupsTable } from '../../components/groups-table';
import { ConfirmDeletionAlertDialog } from '../../components/confirm-deletion-alert-dialog';
import { Group } from '../../services/api-protocols';
import { GroupDetailsModal } from '../../components/group-details-modal';
import { useMutation } from '@tanstack/react-query';
import * as api from '../../services/api';
import { queryClient } from '../../services/query-client';
import { getErrorMessage } from '../../services/helpers';
import { usePaginationSearchParam } from '../../hooks/use-pagination-search-param';

export const GroupsPage: React.FC = () => {
    const { page, setParams } = usePaginationSearchParam();
    const { groupsQuery } = useGroups({
        resultsPerPage: 20,
        page,
        orderBy: 'creationDate',
        order: 'asc',
    });
    const { setActiveMenuItem } = useMenuContext(); // @todo: Convert context to zustand hook.
    const [selectedGroup, setSelectedGroup] = React.useState<Group>();
    const groupDetailsModalDisclosure = useDisclosure();
    const createGroupModalDisclosure = useDisclosure();
    const confirmDeletionAlertDialogDisclosure = useDisclosure();
    const toast = useToast();

    const groups = groupsQuery.data?.data ?? [];
    const numberOfGroups = groupsQuery.data?.numberOfResults ?? 0;
    const numberOfPages = groupsQuery.data?.numberOfPages ?? 0;

    React.useEffect(() => {
        if (numberOfPages > 0 && page > numberOfPages) {
            setParams({ page: 1 });
        }

        setActiveMenuItem('ADMIN_GROUPS');
    }, [page, numberOfGroups]);

    const deleteGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: string }) => {
            const response = await api.deleteGroup({ groupId: mut.groupId });
            if (!response.success) throw new Error(response.error);
            return mut;
        },
        onSuccess: (data) => {
            toast({
                title: `Grupo criado`,
                description: `O grupo ${data.groupId} foi deletado com sucesso.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            queryClient.invalidateQueries({ queryKey: ['groups'] }).catch(console.error);
            setSelectedGroup(undefined);
            confirmDeletionAlertDialogDisclosure.onClose();
        },
        onError: (error) => {
            toast({
                title: 'Falha ao deletar grupo',
                status: 'error',
                description: getErrorMessage(error),
                duration: 5000,
                isClosable: true,
            });
        },
    });

    return (
        <Box>
            <CreateGroupModal
                isOpen={createGroupModalDisclosure.isOpen}
                onClose={createGroupModalDisclosure.onClose}
            />

            <GroupDetailsModal
                group={selectedGroup ?? ({} as Group)}
                isOpen={groupDetailsModalDisclosure.isOpen}
                onClose={() => {
                    groupDetailsModalDisclosure.onClose();
                    setSelectedGroup(undefined);
                }}
            />

            <ConfirmDeletionAlertDialog
                title={`Deletar grupo ${selectedGroup?.name ?? ''}`}
                text={`Você tem certeza que deseja deletar o grupo selecionado? Essa ação não pode ser desfeita.`}
                isOpen={confirmDeletionAlertDialogDisclosure.isOpen}
                onClose={confirmDeletionAlertDialogDisclosure.onClose}
                onConfirm={() => {
                    if (selectedGroup === undefined) return;
                    deleteGroupMutation.mutate({ groupId: selectedGroup.id });
                }}
                isLoading={deleteGroupMutation.isPending}
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
                        <Heading color='gray.800'>Grupos</Heading>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {numberOfGroups === 0 ? 'Nenhum grupo encontrado' : null}
                            {numberOfGroups === 1 ? `${numberOfGroups} grupo encontrado` : null}
                            {numberOfGroups > 1 ? `${numberOfGroups} grupos encontrados` : null}
                        </Text>
                    </VStack>

                    <ButtonGroup>
                        <Tooltip label='Recarregar'>
                            <IconButton
                                aria-label='Recarregar'
                                variant={'outline'}
                                colorScheme='blue'
                                hidden={groupsQuery.isLoading}
                                isLoading={groupsQuery.isFetching}
                                onClick={() => {
                                    groupsQuery.refetch().catch(console.error);
                                }}
                            >
                                <FiRefreshCw />
                            </IconButton>
                        </Tooltip>

                        <Button
                            variant={'solid'}
                            colorScheme='blue'
                            leftIcon={<FiPlus />}
                            onClick={createGroupModalDisclosure.onOpen}
                        >
                            Novo grupo
                        </Button>
                    </ButtonGroup>
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
                        groups={groups}
                        isLoading={groupsQuery.isLoading}
                        onSelect={(group) => {
                            setSelectedGroup(group);
                            groupDetailsModalDisclosure.onOpen();
                        }}
                        onDelete={(group) => {
                            setSelectedGroup(group);
                            confirmDeletionAlertDialogDisclosure.onOpen();
                        }}
                    />

                    <Paginator
                        activePage={page}
                        totalPages={numberOfPages}
                        onPageChange={(selectedPage) => {
                            setParams({ page: selectedPage });
                        }}
                    />
                </Stack>
            </Container>
        </Box>
    );
};
