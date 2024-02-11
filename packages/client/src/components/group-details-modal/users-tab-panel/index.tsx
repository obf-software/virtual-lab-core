import {
    Box,
    Button,
    HStack,
    IconButton,
    Stack,
    TabPanel,
    Tooltip,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import * as api from '../../../services/api';
import { Group, User } from '../../../services/api-protocols';
import { Select } from 'chakra-react-select';
import { FiRefreshCw } from 'react-icons/fi';
import { Paginator } from '../../paginator';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../services/query-client';
import { getErrorMessage } from '../../../services/helpers';
import { GroupUsersTable } from '../../group-users-table';
import { useUsers } from '../../../hooks/use-users';

interface GroupDetailsModalUsersTabPanelProps {
    group: Group;
}

export const GroupDetailsModalUsersTabPanel: React.FC<GroupDetailsModalUsersTabPanelProps> = ({
    group,
}) => {
    const [page, setPage] = React.useState(1);
    const { usersQuery: groupUsersQuery } = useUsers({
        groupId: group.id,
        resultsPerPage: 20,
        page,
        orderBy: 'lastSignInDate',
        order: 'desc',
    });
    const toast = useToast();
    const [usersToLink, setUsersToLink] = React.useState<User[]>([]);

    const [textQuery, setTextQuery] = React.useState('');
    const [textQueryDebounced, setTextQueryDebounced] = React.useState(textQuery);
    const { usersQuery: searchUsersQuery } = useUsers({
        resultsPerPage: 20,
        page: 1,
        orderBy: 'lastSignInDate',
        order: 'desc',
        textQuery: textQueryDebounced,
    });

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setTextQueryDebounced(textQuery);
        }, 500);
        return () => {
            clearTimeout(timeout);
        };
    }, [textQuery]);

    const groupUsers = groupUsersQuery.data?.data ?? [];
    const numberOfPages = groupUsersQuery.data?.numberOfPages ?? 0;

    const unlinkUserFromGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: string; userId: string }) => {
            const response = await api.unlinkUsersFromGroup({
                groupId: mut.groupId,
                userIds: [mut.userId],
            });
            if (!response.success) throw new Error(response.error);
            return { mut };
        },
        onSuccess: ({ mut }) => {
            queryClient
                .invalidateQueries({ queryKey: [`groupUsers_${mut.groupId}`] })
                .catch(console.error);
        },
        onError: (error) => {
            toast({
                title: 'Falha ao remover usuário do grupo',
                status: 'error',
                description: getErrorMessage(error),
                duration: 5000,
                isClosable: true,
            });
        },
    });

    const linkUsersToGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: string; userIds: string[] }) => {
            const response = await api.linkUsersToGroup({
                groupId: mut.groupId,
                userIds: mut.userIds,
            });
            if (!response.success) throw new Error(response.error);
            return { mut };
        },
        onSuccess: ({ mut }) => {
            queryClient
                .invalidateQueries({ queryKey: [`groupUsers_${mut.groupId}`] })
                .catch(console.error);
            setUsersToLink([]);
        },
        onError: (error) => {
            toast({
                title: 'Falha ao adicionar usuários ao grupo',
                status: 'error',
                description: getErrorMessage(error),
                duration: 5000,
                isClosable: true,
            });
        },
    });

    return (
        <TabPanel>
            <Stack
                mt={'2%'}
                spacing={'6'}
            >
                <HStack alignItems={'center'}>
                    <Box w={'100%'}>
                        <Select
                            isMulti
                            name='Grupos'
                            placeholder='Buscar usuários'
                            isLoading={searchUsersQuery.isFetching}
                            options={searchUsersQuery.data?.data?.map((user) => ({
                                label: `${user.username} (${user.role})`,
                                value: user,
                            }))}
                            onInputChange={(value) => {
                                setTextQuery(value);
                            }}
                            onChange={(selected) => {
                                setUsersToLink(selected.map((item) => item.value) ?? []);
                            }}
                            value={usersToLink.map((user) => ({
                                label: `${user.username} (${user.role})`,
                                value: user,
                            }))}
                        />
                    </Box>

                    <Button
                        colorScheme={'blue'}
                        px={10}
                        isLoading={linkUsersToGroupMutation.isPending}
                        onClick={() => {
                            if (usersToLink.length === 0) return;

                            linkUsersToGroupMutation.mutate({
                                groupId: group.id,
                                userIds: usersToLink.map((user) => user.id),
                            });
                        }}
                    >
                        Adicionar ao grupo
                    </Button>
                    <Tooltip label='Recarregar'>
                        <IconButton
                            aria-label='Recarregar'
                            variant={'outline'}
                            colorScheme='blue'
                            isLoading={groupUsersQuery.isFetching}
                            onClick={() => {
                                groupUsersQuery.refetch().catch(console.error);
                            }}
                        >
                            <FiRefreshCw />
                        </IconButton>
                    </Tooltip>
                </HStack>

                <GroupUsersTable
                    users={groupUsers}
                    isLoading={groupUsersQuery.isLoading}
                    isRemovingFromGroup={unlinkUserFromGroupMutation.isPending}
                    onRemoveFromGroup={(user) => {
                        unlinkUserFromGroupMutation.mutate({ groupId: group.id, userId: user.id });
                    }}
                />

                <Paginator
                    activePage={page}
                    onPageChange={(selectedPage) => {
                        setPage(selectedPage);
                    }}
                    totalPages={numberOfPages}
                />
            </Stack>
        </TabPanel>
    );
};
