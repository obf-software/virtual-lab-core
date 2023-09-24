import {
    ButtonGroup,
    IconButton,
    Spinner,
    Table,
    TableCaption,
    TableContainer,
    Tag,
    Tbody,
    Td,
    Th,
    Thead,
    Tooltip,
    Tr,
} from '@chakra-ui/react';
import React from 'react';
import { FiEdit } from 'react-icons/fi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { useMyGroupsContext } from '../../../contexts/my-groups/hook';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export const MyGroupsTable: React.FC = () => {
    const { isLoading, myGroups } = useMyGroupsContext();

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
                {myGroups.length === 0 && isLoading === false ? (
                    <TableCaption>Nenhum grupo encontrado</TableCaption>
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
                        <Th>Nome</Th>
                        <Th>Descrição</Th>
                        <Th>Portfólio</Th>
                        <Th>Criado em</Th>
                        <Th></Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {isLoading === false &&
                        myGroups.map((group, index) => (
                            <Tr key={`tr-${index}`}>
                                <Td>{group.name}</Td>
                                <Td>
                                    <Tooltip label={group.description}>
                                        {`${group.description.slice(0, 15)}...`}
                                    </Tooltip>
                                </Td>
                                <Td>
                                    <Tag>{group.awsPortfolioId}</Tag>
                                </Td>

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
