import {
    Checkbox,
    IconButton,
    List,
    ListIcon,
    ListItem,
    Spinner,
    Table,
    TableCaption,
    TableContainer,
    Tag,
    TagProps,
    Tbody,
    Td,
    Th,
    Thead,
    Tooltip,
    Tr,
} from '@chakra-ui/react';
import React from 'react';
import {
    RowSelectionState,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { Role, User } from '../../../services/api-protocols';
import { roleToDisplayString } from '../../../services/helpers';
import dayjs from 'dayjs';
import { FiCpu, FiExternalLink, FiMonitor, FiMoon } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface UsersPageTableProps {
    users: User[];
    error?: string;
    isLoading?: boolean;
    isDisabled?: boolean;
}

const roleStyleMap: Record<Role, { TagColorScheme: TagProps['colorScheme']; label: string }> = {
    NONE: {
        TagColorScheme: 'gray',
        label: roleToDisplayString('NONE'),
    },
    PENDING: {
        TagColorScheme: 'yellow',
        label: roleToDisplayString('PENDING'),
    },
    USER: {
        TagColorScheme: 'blue',
        label: roleToDisplayString('USER'),
    },
    ADMIN: {
        TagColorScheme: 'red',
        label: roleToDisplayString('ADMIN'),
    },
};

export const UsersPageTable: React.FC<UsersPageTableProps> = ({
    users,
    error,
    isLoading,
    isDisabled,
}) => {
    const columnHelper = createColumnHelper<User>();
    const navigate = useNavigate();

    const columns = [
        // columnHelper.display({
        //     id: 'select',

        //     header: ({ table }) => (
        //         <Checkbox
        //             isChecked={table.getIsAllRowsSelected()}
        //             isIndeterminate={table.getIsSomeRowsSelected()}
        //             onChange={table.getToggleAllRowsSelectedHandler()}
        //         />
        //     ),
        //     cell: ({ row }) => (
        //         <Checkbox
        //             isChecked={row.getIsSelected()}
        //             isDisabled={!row.getCanSelect()}
        //             isIndeterminate={row.getIsSomeSelected()}
        //             onChange={row.getToggleSelectedHandler()}
        //         />
        //     ),
        // }),
        columnHelper.accessor('name', {
            id: 'name',
            header: 'Nome',
            cell: (row) => row.getValue(),
        }),
        columnHelper.accessor((row) => row.preferredUsername ?? row.username, {
            id: 'username',
            header: 'Usuário',
            cell: (row) => row.getValue(),
        }),
        columnHelper.accessor('role', {
            id: 'role',
            header: 'Cargo',
            cell: (row) => (
                <Tag
                    fontWeight={'bold'}
                    colorScheme={roleStyleMap[row.getValue()].TagColorScheme}
                >
                    {roleStyleMap[row.getValue()].label}
                </Tag>
            ),
        }),
        columnHelper.accessor('createdAt', {
            id: 'createdAt',
            header: 'Criado em',
            cell: (row) => dayjs(row.getValue()).format('DD/MM/YYYY'),
        }),
        columnHelper.accessor('lastLoginAt', {
            id: 'lastLoginAt',
            header: 'Último acesso',
            cell: (row) =>
                row.getValue() !== undefined ? dayjs(row.getValue()).format('DD/MM/YYYY') : 'Nunca',
        }),
        // columnHelper.accessor('quotas', {
        //     id: 'quotas',
        //     header: 'Cotas',
        //     cell: (row) => (
        //         <List spacing={2}>
        //             <Tooltip
        //                 label={`Máximo de instâncias permitidas: ${row.getValue().maxInstances}`}
        //             >
        //                 <ListItem>
        //                     <ListIcon
        //                         as={FiMonitor}
        //                         color='green'
        //                     />
        //                     {row.getValue().maxInstances}
        //                 </ListItem>
        //             </Tooltip>

        //             <Tooltip
        //                 label={`Tipos de instâncias permitidos: ${row.getValue().allowedInstanceTypes.join(', ')}`}
        //             >
        //                 <ListItem>
        //                     <ListIcon
        //                         as={FiCpu}
        //                         color='black'
        //                     />
        //                     {row.getValue().allowedInstanceTypes.join(', ').slice(0, 30)}
        //                 </ListItem>
        //             </Tooltip>

        //             <Tooltip
        //                 label={`Pode criar instâncias com hibernação? ${row.getValue().canLaunchInstanceWithHibernation ? 'Sim' : 'Não'}`}
        //             >
        //                 <ListItem>
        //                     <ListIcon
        //                         as={FiMoon}
        //                         color='blue'
        //                     />
        //                     {row.getValue().canLaunchInstanceWithHibernation ? 'Sim' : 'Não'}
        //                 </ListItem>
        //             </Tooltip>
        //         </List>
        //     ),
        // }),
        columnHelper.display({
            id: 'actions',
            header: 'Abrir',
            cell: ({ row }) => (
                <Tooltip label='Abrir usuário'>
                    <IconButton
                        isDisabled={isDisabled}
                        aria-label='Abrir usuário'
                        icon={<FiExternalLink />}
                        colorScheme='blue'
                        onClick={() => {
                            navigate(`/admin/user/${row.original.id}`);
                        }}
                    />
                </Tooltip>
            ),
        }),
    ];

    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

    const table = useReactTable<User>({
        columns,
        data: users,
        state: {
            rowSelection,
        },
        enableRowSelection: true,
        enableMultiRowSelection: true,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
    });

    React.useEffect(() => {
        if (!!isLoading || !!isDisabled) {
            setRowSelection({});
        }
    }, [isLoading, isDisabled]);

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
                {error !== undefined && (
                    <TableCaption color='red.500'>Falha ao carregar usuários: {error}</TableCaption>
                )}

                {users.length === 0 && !isLoading && error === undefined ? (
                    <TableCaption>Nenhum usuário encontrado</TableCaption>
                ) : null}

                {isLoading && (
                    <TableCaption>
                        <Spinner
                            size='xl'
                            speed='1s'
                            thickness='4px'
                            color='blue.500'
                            emptyColor='gray.200'
                        />
                    </TableCaption>
                )}

                <Thead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Th key={header.id}>
                                    {!header.isPlaceholder &&
                                        flexRender(
                                            header.column.columnDef.header,
                                            header.getContext(),
                                        )}
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </Thead>

                <Tbody>
                    {table.getRowModel().rows.map((row) => (
                        <Tr
                            key={row.id}
                            bgColor={row.index % 2 === 1 ? 'gray.50' : 'inherit'}
                        >
                            {row.getVisibleCells().map((cell) => (
                                <Td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
            </Table>
        </TableContainer>
    );
};
