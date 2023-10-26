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
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { CreateGroupModal } from './create-group-modal';
import { useSearchParams } from 'react-router-dom';
import { useGroups } from '../../hooks/groups';
import { GroupsTable } from '../../components/groups-table';
import { ConfirmDeletionModal } from '../../components/confirm-deletion-modal';
import { Group } from '../../services/api/protocols';
import { GroupDetailsModal } from '../../components/group-details-modal';
import { useMutation } from '@tanstack/react-query';
import * as api from '../../services/api/service';
import { queryClient } from '../../services/query/service';
import { getErrorMessage } from '../../services/helpers';

export const GroupsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const { groupsQuery } = useGroups({ resultsPerPage: 20, page });
    const { setActiveMenuItem } = useMenuContext(); // TODO: Convert context to zustand hook.
    const [selectedGroup, setSelectedGroup] = React.useState<Group>();
    const groupDetailsModalDisclosure = useDisclosure();
    const createGroupModalDisclosure = useDisclosure();
    const confirmDeletionModalDisclosure = useDisclosure();
    const toast = useToast();

    React.useEffect(() => {
        if (groupsQuery.data?.numberOfPages && page > groupsQuery.data?.numberOfPages) {
            setSearchParams((prev) => {
                prev.set('page', '1');
                return prev;
            });
        } else {
            setSearchParams((prev) => {
                prev.set('page', page.toString());
                return prev;
            });
        }

        setActiveMenuItem('ADMIN_GROUPS');
    }, [page, groupsQuery.data?.numberOfPages]);

    const numberOfGroups = groupsQuery.data?.numberOfResults ?? 0;

    const deleteGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: number }) => {
            const { error } = await api.deleteGroup(mut.groupId);
            if (error !== undefined) throw new Error(error);
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

            queryClient.invalidateQueries(['groups']).catch(console.error);
            setSelectedGroup(undefined);
            confirmDeletionModalDisclosure.onClose();
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
                group={selectedGroup}
                isOpen={groupDetailsModalDisclosure.isOpen}
                onClose={() => {
                    groupDetailsModalDisclosure.onClose();
                    setSelectedGroup(undefined);
                }}
            />

            <ConfirmDeletionModal
                title={`Deletar grupo ${selectedGroup?.name ?? ''}`}
                text={`Você tem certeza que deseja deletar o grupo selecionado? Essa ação não pode ser desfeita.`}
                isOpen={confirmDeletionModalDisclosure.isOpen}
                onClose={confirmDeletionModalDisclosure.onClose}
                onConfirm={() => {
                    if (selectedGroup === undefined) return;
                    deleteGroupMutation.mutate({ groupId: selectedGroup.id });
                }}
                isLoading={deleteGroupMutation.isLoading}
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
                        <IconButton
                            aria-label='Recarregar'
                            variant={'outline'}
                            colorScheme='blue'
                            isLoading={groupsQuery.isFetching}
                            onClick={() => {
                                groupsQuery.refetch().catch(console.error);
                            }}
                        >
                            <FiRefreshCw />
                        </IconButton>

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

                <GroupsTable
                    groups={groupsQuery.data?.data ?? []}
                    isLoading={groupsQuery.isLoading}
                    onSelect={(group) => {
                        setSelectedGroup(group);
                        groupDetailsModalDisclosure.onOpen();
                    }}
                    onDelete={(group) => {
                        setSelectedGroup(group);
                        confirmDeletionModalDisclosure.onOpen();
                    }}
                />

                <Paginator
                    activePage={page}
                    totalPages={groupsQuery.data?.numberOfPages ?? 0}
                    onPageChange={(selectedPage) => {
                        setSearchParams((prev) => {
                            prev.set('page', selectedPage.toString());
                            return prev;
                        });
                    }}
                />
            </Container>
        </Box>
    );
};
