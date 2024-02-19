import React from 'react';
import { ButtonGroup, IconButton, IconButtonProps, Td, Tooltip, Tr } from '@chakra-ui/react';
import relativeTime from 'dayjs/plugin/relativeTime';
import { User } from '../../../services/api-protocols';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { roleToDisplayString } from '../../../services/helpers';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UsersTableRowProps {
    user: User;
    onUserSelect?: () => void;
    actions?: {
        iconButtonProps: IconButtonProps;
    }[];
}

export const UsersTableRow: React.FC<UsersTableRowProps> = ({ user, onUserSelect, actions }) => {
    return (
        <Tr
            _hover={{
                bg: 'gray.50',
                cursor: 'pointer',
            }}
        >
            <Td onClick={() => onUserSelect?.()}>{user.username}</Td>
            <Td onClick={() => onUserSelect?.()}>{roleToDisplayString(user.role)}</Td>
            <Td onClick={() => onUserSelect?.()}>{dayjs(user.createdAt).format('DD/MM/YYYY')}</Td>
            <Td onClick={() => onUserSelect?.()}>
                {user.lastLoginAt !== null ? dayjs(user.lastLoginAt).fromNow() : 'Nunca'}
            </Td>

            {actions === undefined || actions.length === 0 ? null : (
                <Td
                    isNumeric
                    cursor='initial'
                >
                    <ButtonGroup>
                        {actions?.map((action, index) => (
                            <Tooltip
                                key={index}
                                label={action.iconButtonProps['aria-label']}
                            >
                                <IconButton
                                    key={index}
                                    {...action.iconButtonProps}
                                />
                            </Tooltip>
                        ))}
                    </ButtonGroup>
                </Td>
            )}
        </Tr>
    );
};
