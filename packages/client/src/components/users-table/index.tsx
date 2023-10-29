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
import React from 'react';
import { UsersTableRow } from './users-table-row';
import { User } from '../../services/api/protocols';

interface UsersTableProps {
    users: User[];
    isLoading: boolean;
    onSelect?: (user: User) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, isLoading, onSelect }) => {
    return (
        <TableContainer
            bgColor={'white'}
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
                    <TableCaption>Nenhum usuário encontrado</TableCaption>
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
                    </Tr>
                </Thead>

                <Tbody>
                    {isLoading === false &&
                        users.map((user, index) => (
                            <UsersTableRow
                                key={`users-table-row-${user.username}-${index}`}
                                user={user}
                                onClick={() => onSelect?.(user)}
                            />
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
