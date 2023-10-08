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
import { UsersTableRow } from './row';
import { useUsers } from '../../../hooks/users';

interface UsersTableProps {
    resultsPerPage: number;
    page: number;
}

export const UsersTable: React.FC<UsersTableProps> = ({ resultsPerPage, page }) => {
    const { usersQuery } = useUsers({ resultsPerPage, page });

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
                {usersQuery.data?.data.length === 0 && !usersQuery.isFetching ? (
                    <TableCaption>Nenhum usuário encontrado</TableCaption>
                ) : null}

                {usersQuery.isLoading ? (
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
                    {usersQuery.data?.data.map((user, index) => (
                        <UsersTableRow
                            key={`users-table-row-${index}`}
                            user={user}
                        />
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
