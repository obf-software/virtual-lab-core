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
import { UserGroupsTableRow } from './user-groups-table-row';
import { Group } from '../../services/api/protocols';

interface UserGroupsTableProps {
    groups: Group[];
    isLoading: boolean;
    isRemovingFromGroup: boolean;
    onRemoveFromGroup: (group: Group) => void;
}

export const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
    groups,
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
                {groups.length === 0 && isLoading === false ? (
                    <TableCaption>O usuário não está em nenhum grupo</TableCaption>
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
                        <Th>Atualizado</Th>
                        <Th></Th>
                    </Tr>
                </Thead>

                <Tbody>
                    {isLoading === false &&
                        groups.map((group, index) => (
                            <UserGroupsTableRow
                                key={`user-groups-table-row-${group.id}-${index}`}
                                group={group}
                                onRemoveFromGroup={() => {
                                    onRemoveFromGroup(group);
                                }}
                                isLoading={isRemovingFromGroup}
                            />
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
