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
import { FiTrash2 } from 'react-icons/fi';
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

    const onOpenGroup = () => {
        alert('Abrir grupo');
    };

    return (
        <Tr
            _hover={{
                bg: 'gray.50',
                cursor: 'pointer',
            }}
        >
            <Td onClick={onOpenGroup}>{group.name}</Td>
            <Td onClick={onOpenGroup}>
                <Tooltip label={group.description}>
                    {`${group.description.slice(0, 15)}...`}
                </Tooltip>
            </Td>
            <Td onClick={onOpenGroup}>
                <Tag>{group.awsPortfolioId}</Tag>
            </Td>

            <Td
                onClick={onOpenGroup}
                cursor='pointer'
            >
                {dayjs(group.createdAt).format('DD/MM/YYYY')}
            </Td>
            <Td
                isNumeric
                cursor='initial'
            >
                <ButtonGroup>
                    <Tooltip label='Excluir'>
                        <IconButton
                            aria-label='Excluir grupo'
                            icon={<FiTrash2 />}
                            variant='solid'
                            colorScheme='red'
                            size='sm'
                            onClick={confirmDeletionModalDisclosure.onOpen}
                        />
                    </Tooltip>
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
