import {
    ButtonGroup,
    IconButton,
    Spinner,
    Table,
    TableCaption,
    TableContainer,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
} from '@chakra-ui/react';
import React from 'react';
import { FiEdit } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { useUsersContext } from '../../../contexts/users/hook';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UsersTableProps {}

export const UsersTable: React.FC<UsersTableProps> = () => {
    const { isLoading, users } = useUsersContext();

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
                        <Th></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {isLoading === false &&
                        users.map((user, index) => (
                            <Tr key={`tr-${index}`}>
                                <Td>{user.username}</Td>
                                <Td>{user.role.toUpperCase()}</Td>
                                <Td>{dayjs(user.createdAt).format('DD/MM/YYYY')}</Td>
                                <Td>{dayjs(user.lastLoginAt).fromNow(false)}</Td>
                                <Td isNumeric>
                                    <ButtonGroup>
                                        <IconButton
                                            aria-label='Abrir detalhes'
                                            icon={<FiEdit />}
                                            variant='outline'
                                            colorScheme='blue'
                                            size='sm'
                                        />
                                    </ButtonGroup>
                                </Td>
                            </Tr>
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
