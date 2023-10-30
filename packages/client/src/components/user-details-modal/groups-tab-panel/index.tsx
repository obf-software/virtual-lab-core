import { Box, Button, HStack, IconButton, Stack, TabPanel, useToast } from '@chakra-ui/react';
import React from 'react';
import * as api from '../../../services/api/service';
import { Group, User } from '../../../services/api/protocols';
import { Select } from 'chakra-react-select';
import { FiRefreshCw } from 'react-icons/fi';
import { Paginator } from '../../paginator';
import { UserGroupsTable } from '../../user-groups-table';
import { useUserGroups } from '../../../hooks/user-groups';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../services/query/service';
import { getErrorMessage } from '../../../services/helpers';
import { useSearchGroups } from '../../../hooks/search-groups';

interface UserDetailsModalGroupsTabPanelProps {
    user: User;
}

export const UserDetailsModalGroupsTabPanel: React.FC<UserDetailsModalGroupsTabPanelProps> = ({
    user,
}) => {
    const [page, setPage] = React.useState(1);
    const { userGroupsQuery } = useUserGroups(user.id, { resultsPerPage: 5, page });
    const toast = useToast();
    const [groupsToLink, setGroupsToLink] = React.useState<Group[]>([]);

    const [textQuery, setTextQuery] = React.useState('');
    const [textQueryDebounced, setTextQueryDebounced] = React.useState(textQuery);
    const { searchGroupsQuery } = useSearchGroups({ textQuery: textQueryDebounced });

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setTextQueryDebounced(textQuery);
        }, 500);
        return () => {
            clearTimeout(timeout);
        };
    }, [textQuery]);

    const userGroups = userGroupsQuery?.data?.data ?? [];
    const numberOfPages = userGroupsQuery?.data?.numberOfPages ?? 0;

    const unlinkUserFromGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: number; userId: number }) => {
            const { error } = await api.unlinkUsersFromGroup(mut.groupId, [mut.userId]);
            if (error !== undefined) throw new Error(error);
            return { mut };
        },
        onSuccess: ({ mut }) => {
            queryClient.invalidateQueries([`userGroups_${mut.userId}`]).catch(console.error);
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

    const linkUserToGroupsMutation = useMutation({
        mutationFn: async (mut: { groupIds: number[]; userId: number }) => {
            const results = await Promise.all(
                mut.groupIds.map((groupId) => api.linkUsersToGroup(groupId, [mut.userId])),
            );

            const errors = results
                .map((result) => result.error)
                .filter((error) => error !== undefined)
                .map((error) => error!);
            if (errors.length > 0) throw new Error(errors.join('\n'));
            return { mut };
        },
        onSuccess: ({ mut }) => {
            queryClient.invalidateQueries([`userGroups_${mut.userId}`]).catch(console.error);
            setGroupsToLink([]);
        },
        onError: (error) => {
            toast({
                title: 'Falha ao adicionar usuários aos grupos',
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
                            placeholder='Buscar grupos'
                            isLoading={searchGroupsQuery.isFetching}
                            options={searchGroupsQuery.data?.map((group) => ({
                                label: `${group.name} (${group.portfolioId})`,
                                value: group,
                            }))}
                            onInputChange={(value) => {
                                setTextQuery(value);
                            }}
                            onChange={(selected) => {
                                setGroupsToLink(selected.map((item) => item.value) ?? []);
                            }}
                            value={groupsToLink.map((group) => ({
                                label: `${group.name} (${group.portfolioId})`,
                                value: group,
                            }))}
                        />
                    </Box>

                    <Button
                        colorScheme={'blue'}
                        px={10}
                        isLoading={linkUserToGroupsMutation.isLoading}
                        onClick={() => {
                            if (groupsToLink.length === 0) return;

                            linkUserToGroupsMutation.mutate({
                                groupIds: groupsToLink.map((group) => group.id),
                                userId: user.id,
                            });
                        }}
                    >
                        Adicionar aos grupos
                    </Button>
                    <IconButton
                        aria-label='Recarregar'
                        variant={'outline'}
                        colorScheme='blue'
                        isLoading={userGroupsQuery.isFetching}
                        onClick={() => {
                            userGroupsQuery?.refetch().catch(console.error);
                        }}
                    >
                        <FiRefreshCw />
                    </IconButton>
                </HStack>

                <UserGroupsTable
                    groups={userGroups}
                    isLoading={false}
                    isRemovingFromGroup={unlinkUserFromGroupMutation.isLoading}
                    onRemoveFromGroup={(group) => {
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
