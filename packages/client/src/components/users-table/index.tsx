import {
    IconButtonProps,
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
import { UsersTableRow } from '../users-table-row';
import { User } from '../../services/api-protocols';

interface UsersTableProps {
    users: User[];
    isLoading: boolean;
    error?: string;
    onUserSelect?: (user: User) => void;
    actions?: {
        iconButtonProps: IconButtonProps;
    }[];
}

export const UsersTable: React.FC<UsersTableProps> = ({
    users,
    isLoading,
    error,
    onUserSelect,
    actions,
}) => {
    const shouldHideActions = actions === undefined || actions.length === 0;

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
                {error !== undefined ? (
                    <TableCaption color='red.500'>Falha ao carregar usuários: {error}</TableCaption>
                ) : null}

                {users.length === 0 && !isLoading && error === undefined ? (
                    <TableCaption>Nenhum usuário encontrado</TableCaption>
                ) : null}

                {isLoading ? (
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
                        <Th hidden={shouldHideActions}>Ações</Th>
                    </Tr>
                </Thead>

                <Tbody>
                    {!isLoading &&
                        users.map((user, index) => (
                            <UsersTableRow
                                key={`users-table-row-${user.username}-${index}`}
                                user={user}
                                onUserSelect={() => onUserSelect?.(user)}
                                actions={actions}
                            />
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
