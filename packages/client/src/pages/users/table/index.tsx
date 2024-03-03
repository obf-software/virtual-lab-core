import {
    ButtonGroup,
    IconButton,
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
    useToast,
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
import { getErrorMessage, roleToDisplayString } from '../../../services/helpers';
import dayjs from 'dayjs';
import { FiCheck, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useUserOperations } from '../../../hooks/use-user-operations';

interface UsersPageTableProps {
    users: User[];
    error?: string;
    isLoading?: boolean;
    isDisabled?: boolean;
}

const roleStyleMap: Record<Role, { TagColorScheme: TagProps['colorScheme']; label: string }> = {
    NONE: {
        TagColorScheme: 'red',
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
        TagColorScheme: 'green',
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
    const { updateRole } = useUserOperations();
    const navigate = useNavigate();
    const toast = useToast();

    const columns = [
        columnHelper.accessor('name', {
            id: 'name',
            header: 'Nome',
            cell: (row) => row.getValue() ?? '-',
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
        columnHelper.display({
            id: 'actions',
            header: 'Ações',
            cell: ({ row }) => (
                <ButtonGroup>
                    <Tooltip
                        label={
                            row.original.role !== 'PENDING'
                                ? 'Usuário já aprovado'
                                : 'Aprovar usuário'
                        }
                    >
                        <IconButton
                            isDisabled={isDisabled === true || row.original.role !== 'PENDING'}
                            isLoading={updateRole.isPending}
                            aria-label='Aprovar usuário'
                            icon={<FiCheck />}
                            colorScheme='green'
                            onClick={() => {
                                updateRole.mutate(
                                    {
                                        userId: row.original.id,
                                        role: 'USER',
                                    },
                                    {
                                        onError: (error) => {
                                            toast({
                                                title: 'Falha ao aprovar usuário',
                                                description: getErrorMessage(error),
                                                status: 'error',
                                                duration: 5000,
                                                isClosable: true,
                                            });
                                        },
                                    },
                                );
                            }}
                        />
                    </Tooltip>
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
                </ButtonGroup>
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
