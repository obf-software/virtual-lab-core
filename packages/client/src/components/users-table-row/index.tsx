import React from 'react';
import { TableCellProps, TableRowProps, Td, Tr } from '@chakra-ui/react';
import relativeTime from 'dayjs/plugin/relativeTime';
import { User } from '../../services/api-protocols';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { roleToDisplayString } from '../../services/helpers';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UsersTableRowProps {
    tableRowProps?: TableRowProps;
    tableCellProps?: TableCellProps;

    user: User;
}

export const UsersTableRow: React.FC<UsersTableRowProps> = ({
    tableRowProps,
    tableCellProps,
    user,
}) => {
    return (
        <Tr
            _hover={{
                bg: 'gray.50',
                cursor: 'pointer',
            }}
            {...tableRowProps}
        >
            <Td {...tableCellProps}>{user.username}</Td>
            <Td {...tableCellProps}>{roleToDisplayString(user.role)}</Td>
            <Td {...tableCellProps}>{dayjs(user.createdAt).format('DD/MM/YYYY')}</Td>
            <Td {...tableCellProps}>
                {user.lastLoginAt !== null ? dayjs(user.lastLoginAt).fromNow() : 'Nunca'}
            </Td>
        </Tr>
    );
};
