import React from 'react';
import { User } from '../../services/api/protocols';
import {
    Spinner,
    Table,
    TableCaption,
    TableContainer,
    Tbody,
    Th,
    Thead,
    Tr,
} from '@chakra-ui/react';
import { GroupUsersTableRow } from './group-users-table-row';

interface GroupUsersTableProps {
    users: User[];
    isLoading: boolean;
    isRemovingFromGroup: boolean;
    onRemoveFromGroup: (user: User) => void;
}

export const GroupUsersTable: React.FC<GroupUsersTableProps> = ({
    users,
    isLoading,
    isRemovingFromGroup,
    onRemoveFromGroup,
}) => {
    return (
        <TableContainer
            bgColor={'gray.50'}
            p={4}
            borderRadius={12}
            boxShadow={'sm'}
        >
            <Table
                size={'md'}
                variant='simple'
                colorScheme='blue'
            >
                {users.length === 0 && isLoading === false ? (
                    <TableCaption>O grupo não possui usuários</TableCaption>
                ) : null}

                {isLoading !== false ? (
                    <TableCaption>
                        <Spinner
                            size='xl'
                            speed='1s'
                            thickness='4px'
                            color='blue.500'
                            emptyColor='gray.200'
                        />
                    </TableCaption>
                ) : null}

                <Thead>
                    <Tr>
                        <Th>Usuário</Th>
                        <Th>Cargo</Th>
                        <Th>Criado em</Th>
                        <Th>Último acesso</Th>
                        <Th></Th>
                    </Tr>
                </Thead>

                <Tbody>
                    {isLoading === false &&
                        users.map((user, index) => (
                            <GroupUsersTableRow
                                key={`group-users-table-row-${user.id}-${index}`}
                                user={user}
                                onRemoveFromGroup={() => {
                                    onRemoveFromGroup(user);
                                }}
                                isLoading={isRemovingFromGroup}
                            />
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
