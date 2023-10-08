import React from 'react';
import { User } from '../../../../services/api/protocols';
import { Td, Tr } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { useNavigate } from 'react-router-dom';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UsersTableRowProps {
    user: User;
}

export const UsersTableRow: React.FC<UsersTableRowProps> = ({ user }) => {
    const navigate = useNavigate();

    return (
        <Tr
            _hover={{
                bg: 'gray.50',
                cursor: 'pointer',
            }}
            onClick={() => {
                navigate(`/admin/users/${user.id}`);
            }}
        >
            <Td>{user.username}</Td>
            <Td>{user.role}</Td>
            <Td>{dayjs(user.createdAt).format('DD/MM/YYYY')}</Td>
            <Td>{dayjs(user.lastLoginAt).fromNow()}</Td>
        </Tr>
    );
};
