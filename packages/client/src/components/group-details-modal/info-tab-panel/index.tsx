import 'dayjs/locale/pt-br';
import {
    TabPanel,
    Input,
    useToast,
    FormControl,
    FormLabel,
    Textarea,
    InputGroup,
    InputRightElement,
    Spinner,
} from '@chakra-ui/react';
import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import * as api from '../../../services/api/service';
import { Group } from '../../../services/api/protocols';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '../../../services/query/service';
import { getErrorMessage } from '../../../services/helpers';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupDetailsModalInfoTabPanelProps {
    group: Group;
    isEditable: boolean;
}

export const GroupDetailsModalInfoTabPanel: React.FC<GroupDetailsModalInfoTabPanelProps> = ({
    group,
    isEditable,
}) => {
    const toast = useToast();
    const [name, setName] = React.useState(group.name);
    const [nameDebounced, setNameDebounced] = React.useState(group.name);
    const [description, setDescription] = React.useState(group.description);
    const [descriptionDebounced, setDescriptionDebounced] = React.useState(group.description);

    const updateGroupMutation = useMutation({
        mutationFn: async (mut: { groupId: number; name?: string; description?: string }) => {
            const { data, error } = await api.updateGroup(mut.groupId, {
                name: mut.name,
                description: mut.description,
            });
            if (error !== undefined) throw new Error(error);
            return { mut, data };
        },
        onSuccess: () => {
            // TODO: use optimistic updates instead
            queryClient.invalidateQueries([`groups`]).catch(console.error);
        },
        onError: (error) => {
            toast({
                title: 'Falha ao atualizar o grupo',
                status: 'error',
                description: getErrorMessage(error),
                duration: 5000,
                isClosable: true,
            });
        },
    });

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            if (nameDebounced !== name) {
                setNameDebounced(name);
            }

            if (descriptionDebounced !== description) {
                setDescriptionDebounced(description);
            }
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, [name, description, setNameDebounced, setDescriptionDebounced]);

    React.useEffect(() => {
        if (!isEditable) return;
        if (nameDebounced === group.name && descriptionDebounced === group.description) return;

        updateGroupMutation.mutate({
            groupId: group.id,
            name: nameDebounced,
            description: descriptionDebounced,
        });
    }, [isEditable, group.id, nameDebounced, descriptionDebounced, updateGroupMutation.mutate]);

    return (
        <TabPanel>
            <FormControl
                mt={'2%'}
                isRequired
                isReadOnly={!isEditable}
            >
                <FormLabel htmlFor='name'>Nome</FormLabel>
                <InputGroup>
                    <Input
                        id='name'
                        value={name}
                        onChange={(event) => {
                            const value = event.target.value;
                            if (value !== name) {
                                setName(value);
                            }
                        }}
                    />
                    <InputRightElement>
                        {updateGroupMutation.isLoading ? <Spinner size='sm' /> : null}
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <FormControl
                mt={'2%'}
                isRequired
                isReadOnly={!isEditable}
            >
                <FormLabel htmlFor='description'>Descrição</FormLabel>
                <InputGroup>
                    <Textarea
                        id='description'
                        value={description}
                        onChange={(event) => {
                            const value = event.target.value;
                            if (value !== description) {
                                setDescription(value);
                            }
                        }}
                    />
                    <InputRightElement>
                        {updateGroupMutation.isLoading ? <Spinner size='sm' /> : null}
                    </InputRightElement>
                </InputGroup>
            </FormControl>

            <FormControl
                mt={'2%'}
                isReadOnly
            >
                <FormLabel htmlFor='portfolioId'>Portfólio</FormLabel>
                <Input
                    id='portfolioId'
                    value={group.portfolioId}
                />
            </FormControl>

            <FormControl
                mt={'2%'}
                isReadOnly
            >
                <FormLabel htmlFor='createdAt'>Data de criação</FormLabel>
                <Input
                    id='createdAt'
                    value={`${dayjs(group.createdAt).format('DD/MM/YYYY')} (${dayjs(
                        group.createdAt,
                    ).fromNow()})`}
                />
            </FormControl>

            <FormControl
                mt={'2%'}
                isReadOnly
            >
                <FormLabel htmlFor='updatedAt'>Data da última atualização</FormLabel>
                <Input
                    id='updatedAt'
                    value={`${dayjs(group.updatedAt).format('DD/MM/YYYY')} (${dayjs(
                        group.updatedAt,
                    ).fromNow()})`}
                />
            </FormControl>
        </TabPanel>
    );
};
