import React from 'react';
import { Group } from '../../../../services/api/protocols';
import {
    ButtonGroup,
    IconButton,
    Tag,
    Td,
    Tooltip,
    Tr,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { ConfirmDeletionModal } from '../../../../components/confirm-deletion-modal';
import { deleteGroup } from '../../../../services/api/service';
import { useGroupsContext } from '../../../../contexts/groups/hook';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupsTableRowProps {
    group: Group;
}

export const GroupsTableRow: React.FC<GroupsTableRowProps> = ({ group }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const confirmDeletionModalDisclosure = useDisclosure();
    const toast = useToast();
    const { loadGroupsPage } = useGroupsContext();

    return (
        <Tr>
            <Td>{group.name}</Td>
            <Td>
                <Tooltip label={group.description}>
                    {`${group.description.slice(0, 15)}...`}
                </Tooltip>
            </Td>
            <Td>
                <Tag>{group.awsPortfolioId}</Tag>
            </Td>

            <Td>{dayjs(group.createdAt).format('DD/MM/YYYY')}</Td>
            <Td isNumeric>
                <ButtonGroup>
                    <IconButton
                        aria-label='Abrir detalhes do grupo'
                        icon={<FiEdit />}
                        variant='outline'
                        colorScheme='blue'
                        size='sm'
                    />

                    <IconButton
                        aria-label='Excluir grupo'
                        icon={<FiTrash2 />}
                        variant='solid'
                        colorScheme='red'
                        size='sm'
                        onClick={confirmDeletionModalDisclosure.onOpen}
                    />
                </ButtonGroup>
                <ConfirmDeletionModal
                    title='Excluir grupo'
                    text={`Tem certeza que deseja excluir o grupo ${group.name}? Todos os usuários associados a ele serão desassociados. Essa ação não pode ser desfeita.`}
                    isOpen={confirmDeletionModalDisclosure.isOpen}
                    onClose={confirmDeletionModalDisclosure.onClose}
                    isLoading={isLoading}
                    onConfirm={() => {
                        setIsLoading(true);
                        deleteGroup(group.id)
                            .then(({ error }) => {
                                setIsLoading(false);

                                if (error !== undefined) {
                                    toast({
                                        title: 'Erro ao excluir grupo',
                                        description: error,
                                        status: 'error',
                                        duration: 5000,
                                        isClosable: true,
                                        position: 'bottom-left',
                                        variant: 'left-accent',
                                    });
                                    return;
                                }

                                loadGroupsPage(1, 20).catch(console.error);
                            })
                            .catch(console.error);
                    }}
                />
            </Td>
        </Tr>
    );
};
