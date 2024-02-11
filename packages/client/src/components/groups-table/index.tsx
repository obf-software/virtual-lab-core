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
import { GroupsTableRow } from '../groups-table-row';
import { Group } from '../../services/api-protocols';

interface GroupsTableProps {
    groups: Group[];
    isLoading: boolean;
    error?: string;
    onGroupSelect?: (group: Group) => void;
    actions?: {
        iconButtonProps: IconButtonProps;
    }[];
}

export const GroupsTable: React.FC<GroupsTableProps> = ({
    groups,
    isLoading,
    error,
    onGroupSelect,
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
                    <TableCaption color='red.500'>Falha ao carregar grupos: {error}</TableCaption>
                ) : null}

                {groups.length === 0 && !isLoading && error === undefined ? (
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
                        <Th hidden={shouldHideActions}>Ações</Th>
                    </Tr>
                </Thead>

                <Tbody>
                    {isLoading === false &&
                        groups.map((group, index) => (
                            <GroupsTableRow
                                key={`groups-table-row-${group.id}-${index}`}
                                group={group}
                                onGroupSelect={() => onGroupSelect?.(group)}
                                actions={actions}
                            />
                        ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
