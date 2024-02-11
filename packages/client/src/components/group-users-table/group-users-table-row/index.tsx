import React from 'react';
import { ButtonGroup, IconButton, Td, Tooltip, Tr } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { FiMinusCircle } from 'react-icons/fi';
import { User } from '../../../services/api-protocols';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupUsersTableRowProps {
    user: User;
    onRemoveFromGroup: () => void;
    isLoading: boolean;
}

export const GroupUsersTableRow: React.FC<GroupUsersTableRowProps> = ({
    user,
    onRemoveFromGroup,
    isLoading,
}) => {
    return (
        <Tr>
            <Td>{user.username}</Td>
            <Td>{user.role}</Td>

            <Td>{dayjs(user.createdAt).format('DD/MM/YYYY')}</Td>
            <Td>{user.lastLoginAt !== null ? dayjs(user.lastLoginAt).fromNow() : 'Nunca'}</Td>
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
