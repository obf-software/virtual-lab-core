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
import { GroupsTableRow } from './groups-table-row';
import { Group } from '../../services/api-protocols';

interface GroupsTableProps {
    groups: Group[];
    isLoading: boolean;
    onSelect?: (group: Group) => void;
    onDelete?: (group: Group) => void;
}

export const GroupsTable: React.FC<GroupsTableProps> = ({
    groups,
    isLoading,
    onDelete,
    onSelect,
}) => {
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
                {groups.length === 0 && isLoading === false ? (
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
                        <Th>Criado em</Th>
                        <Th>Atualizado</Th>
                        <Th hidden={onDelete === undefined}></Th>
                    </Tr>
                </Thead>

                <Tbody>
                    {isLoading === false &&
                        groups.map((group, index) => (
                            <GroupsTableRow
                                key={`groups-table-row-${group.id}-${index}`}
                                group={group}
                                onClick={onSelect !== undefined ? () => onSelect(group) : undefined}
                                onDelete={
                                    onDelete !== undefined ? () => onDelete(group) : undefined
                                }
                            />
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
