import React, { useEffect, useState } from 'react';
import { User, UserRole } from '../../../../services/api/protocols';
import { ButtonGroup, IconButton, Td, Tr } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { FiEdit, FiX } from 'react-icons/fi';
import { useUsersContext } from '../../../../contexts/users/hook';
import { GroupBase, OptionBase, Select } from 'chakra-react-select';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UsersTableRowProps {
    user: User;
}

interface SingleSelectRole extends OptionBase {
    value: keyof typeof UserRole;
}

export const UsersTableRow: React.FC<UsersTableRowProps> = ({ user }) => {
    const { isUpdating, updateUserRole } = useUsersContext();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [currentRole, setCurrentRole] = useState<keyof typeof UserRole>(user.role);

    useEffect(() => {
        setCurrentRole(user.role);
    }, [user]);

    return (
        <Tr>
            <Td>{user.username}</Td>
            <Td>
                {isEditing ? (
                    <Select<SingleSelectRole, false, GroupBase<SingleSelectRole>>
                        id='role'
                        name={'role'}
                        placeholder={'Selecione'}
                        menuPosition='fixed'
                        onChange={(option) => {
                            if (option?.value === undefined) return;
                            setIsEditing(false);
                            updateUserRole(user.id, option.value).catch(console.error);
                        }}
                        options={Object.keys(UserRole).map((role) => ({
                            value: role as keyof typeof UserRole,
                            label: role.toUpperCase(),
                        }))}
                        closeMenuOnSelect={true}
                        isSearchable
                    />
                ) : (
                    currentRole
                )}
            </Td>
            <Td>{dayjs(user.createdAt).format('DD/MM/YYYY')}</Td>
            <Td>{dayjs(user.lastLoginAt).fromNow()}</Td>
            <Td isNumeric>
                {isEditing ? (
                    <ButtonGroup>
                        <IconButton
                            aria-label='Cancelar Edição'
                            icon={<FiX />}
                            variant='solid'
                            colorScheme='red'
                            onClick={() => {
                                setIsEditing(false);
                                setCurrentRole(user.role);
                            }}
                        />
                    </ButtonGroup>
                ) : (
                    <IconButton
                        aria-label='Editar'
                        icon={<FiEdit />}
                        variant='outline'
                        colorScheme='blue'
                        isLoading={isUpdating}
                        onClick={() => setIsEditing(true)}
                    />
                )}
            </Td>
        </Tr>
    );
};
