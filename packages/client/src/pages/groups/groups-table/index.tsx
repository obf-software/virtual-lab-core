import {
    ButtonGroup,
    IconButton,
    Table,
    TableCaption,
    TableContainer,
    Tag,
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

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupsTableProps {}

export const GroupsTable: React.FC<GroupsTableProps> = () => {
    const groups: {
        name: string;
        description: string;
        portfolio: string;
        createdAt: string;
        numberOfUsers: number;
    }[] = Array.from({ length: 10 }).map((_, index) => ({
        name: `Grupo ${index}`,
        description: `Descrição do  asdasd asasd asd asd asd asd asd awdasd asdasd a da sgrupo ${index}`,
        portfolio: `p-gbvads6g8asd-${index}`,
        createdAt: new Date().toISOString(),
        numberOfUsers: index,
    }));

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
                {groups.length === 0 ? <TableCaption>Nenhum grupo encontrado</TableCaption> : null}

                <Thead>
                    <Tr>
                        <Th>Nome</Th>
                        <Th>Portfólio</Th>
                        <Th isNumeric>Usuários</Th>
                        <Th>Criado em</Th>
                        <Th></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {groups.map((group, index) => (
                        <Tr key={`tr-${index}`}>
                            <Td>{group.name}</Td>
                            <Td>
                                <Tag>{group.portfolio}</Tag>
                            </Td>
                            <Td isNumeric>{group.numberOfUsers}</Td>
                            <Td>{dayjs(group.createdAt).format('DD/MM/YYYY')}</Td>
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
