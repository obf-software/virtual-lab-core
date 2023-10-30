import React from 'react';
import { ButtonGroup, IconButton, Tag, Td, Tooltip, Tr } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { FiMinusCircle } from 'react-icons/fi';
import { Group } from '../../../services/api/protocols';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UserGroupsTableRowProps {
    group: Group;
    onRemoveFromGroup: () => void;
    isLoading: boolean;
}

export const UserGroupsTableRow: React.FC<UserGroupsTableRowProps> = ({
    group,
    onRemoveFromGroup,
    isLoading,
}) => {
    return (
        <Tr>
            <Td>{group.name}</Td>
            <Td>
                <Tooltip label={group.description}>
                    {`${group.description.slice(0, 15)}...`}
                </Tooltip>
            </Td>
            <Td>
                <Tag>{group.portfolioId}</Tag>
            </Td>
            <Td>{dayjs(group.createdAt).format('DD/MM/YYYY')}</Td>
            <Td>{dayjs(group.updatedAt).fromNow()}</Td>
            <Td isNumeric>
                <ButtonGroup>
                    <Tooltip label='Remover do grupo'>
                        <IconButton
                            aria-label='Remover do grupo'
                            icon={<FiMinusCircle />}
                            variant='solid'
                            colorScheme='red'
                            size='sm'
                            onClick={onRemoveFromGroup}
                            isLoading={isLoading}
                        />
                    </Tooltip>
                </ButtonGroup>
            </Td>
        </Tr>
    );
};
