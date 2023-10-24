import React from 'react';
import { ButtonGroup, IconButton, Tag, Td, Tooltip, Tr } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { FiTrash2 } from 'react-icons/fi';
import { Group } from '../../../services/api/protocols';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupsTableRowProps {
    group: Group;
    onDelete?: () => void;
    onClick?: () => void;
}

export const GroupsTableRow: React.FC<GroupsTableRowProps> = ({ group, onClick, onDelete }) => {
    return (
        <Tr
            _hover={{
                bg: 'gray.50',
                cursor: 'pointer',
            }}
        >
            <Td onClick={onClick}>{group.name}</Td>
            <Td onClick={onClick}>
                <Tooltip label={group.description}>
                    {`${group.description.slice(0, 15)}...`}
                </Tooltip>
            </Td>
            <Td onClick={onClick}>
                <Tag>{group.portfolioId}</Tag>
            </Td>

            <Td
                onClick={onClick}
                cursor='pointer'
            >
                {dayjs(group.createdAt).format('DD/MM/YYYY')}
            </Td>
            <Td
                onClick={onClick}
                cursor='pointer'
            >
                {dayjs(group.updatedAt).fromNow()}
            </Td>
            <Td
                isNumeric
                cursor='initial'
                hidden={onDelete === undefined}
            >
                <ButtonGroup>
                    <Tooltip
                        label='Excluir'
                        hidden={onDelete === undefined}
                    >
                        <IconButton
                            hidden={onDelete === undefined}
                            aria-label='Excluir grupo'
                            icon={<FiTrash2 />}
                            variant='solid'
                            colorScheme='red'
                            size='sm'
                            onClick={onDelete}
                        />
                    </Tooltip>
                </ButtonGroup>
            </Td>

            {/* <ConfirmDeletionModal
                title='Excluir grupo'
                text={`Tem certeza que deseja excluir o grupo ${group.name}? Todos os usuários associados a ele serão desassociados. Essa ação não pode ser desfeita.`}
                isOpen={confirmDeletionModalDisclosure.isOpen}
                onClose={confirmDeletionModalDisclosure.onClose}
                isLoading={isDeleting === true}
                onConfirm={() => {
                    onDelete?.();
                }}
            /> */}
        </Tr>
    );
};
