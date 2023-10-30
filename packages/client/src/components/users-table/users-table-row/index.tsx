import React from 'react';
import { Td, Tr } from '@chakra-ui/react';
import relativeTime from 'dayjs/plugin/relativeTime';
import { User } from '../../../services/api/protocols';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { roleToDisplayString } from '../../../services/helpers';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UsersTableRowProps {
    user: User;
    onClick?: () => void;
}

export const UsersTableRow: React.FC<UsersTableRowProps> = ({ user, onClick }) => {
    return (
        <Tr
            _hover={{
                bg: 'gray.50',
                cursor: 'pointer',
            }}
        >
            <Td onClick={onClick}>{user.username}</Td>
            <Td onClick={onClick}>{roleToDisplayString(user.role)}</Td>
            <Td onClick={onClick}>{dayjs(user.createdAt).format('DD/MM/YYYY')}</Td>
            <Td onClick={onClick}>
                {user.lastLoginAt !== null ? dayjs(user.lastLoginAt).fromNow() : 'Nunca'}
            </Td>
        </Tr>
    );
};
