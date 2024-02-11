import React from 'react';
import { IconButton, IconButtonProps, Td, Tooltip, Tr } from '@chakra-ui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { Group } from '../../services/api-protocols';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupsTableRowProps {
    group: Group;
    onGroupSelect?: () => void;
    actions?: {
        iconButtonProps: IconButtonProps;
    }[];
}

export const GroupsTableRow: React.FC<GroupsTableRowProps> = ({
    group,
    onGroupSelect,
    actions,
}) => {
    return (
        <Tr
            _hover={{
                bg: 'gray.50',
                cursor: 'pointer',
            }}
        >
            <Td onClick={() => onGroupSelect?.()}>{group.name}</Td>

            <Td onClick={() => onGroupSelect?.()}>
                <Tooltip label={group.description}>
                    {`${group.description.slice(0, 15)}...`}
                </Tooltip>
            </Td>

            <Td
                cursor='pointer'
                onClick={() => onGroupSelect?.()}
            >
                {dayjs(group.createdAt).format('DD/MM/YYYY')}
            </Td>

            <Td
                cursor='pointer'
                onClick={() => onGroupSelect?.()}
            >
                {dayjs(group.updatedAt).fromNow()}
            </Td>

            {actions === undefined || actions.length === 0 ? null : (
                <Td
                    isNumeric
                    cursor='initial'
                >
                    {actions?.map((action, index) => (
                        <Tooltip
                            key={index}
                            label={action.iconButtonProps['aria-label']}
                        >
                            <IconButton {...action.iconButtonProps} />
                        </Tooltip>
                    )) ?? null}
                </Td>
            )}
        </Tr>
    );
};
