import { Box, Spinner, Stack, Tag, Text } from '@chakra-ui/react';
import React from 'react';
import { VirtualInstanceState } from '../../../services/api-protocols';

interface InstanceCardStateTagProps {
    state?: VirtualInstanceState | 'PROVISIONING';
}

export const InstanceCardStateTag: React.FC<InstanceCardStateTagProps> = ({ state }) => {
    const stateStyleMap: Record<
        VirtualInstanceState | 'UNKNOWN' | 'PROVISIONING',
        {
            label: string;
            colorScheme: string;
            hasSpinner: boolean;
        }
    > = {
        SHUTTING_DOWN: {
            label: 'Terminando',
            colorScheme: 'red',
            hasSpinner: true,
        },
        PENDING: {
            label: 'Pendente',
            colorScheme: 'orange',
            hasSpinner: true,
        },
        RUNNING: {
            label: 'Ativa',
            colorScheme: 'green',
            hasSpinner: false,
        },
        STOPPED: {
            label: 'Desligada',
            colorScheme: 'red',
            hasSpinner: false,
        },
        STOPPING: {
            label: 'Desligando',
            colorScheme: 'red',
            hasSpinner: true,
        },
        TERMINATED: {
            label: 'Excluída',
            colorScheme: 'gray',
            hasSpinner: false,
        },
        UNKNOWN: {
            label: 'Desconhecido',
            colorScheme: 'gray',
            hasSpinner: false,
        },
        PROVISIONING: {
            label: 'Provisionando',
            colorScheme: 'orange',
            hasSpinner: true,
        },
    };

    const stateStyle = stateStyleMap[state ?? 'UNKNOWN'];

    return (
        <Box>
            <Tag
                colorScheme={stateStyle.colorScheme}
                size={'lg'}
                variant={'subtle'}
            >
                <Stack
                    direction='row'
                    spacing={2}
                    align='center'
                >
                    <Text fontWeight={'black'}>{stateStyle.label}</Text>
                    {stateStyle.hasSpinner && <Spinner size='sm' />}
                </Stack>
            </Tag>
        </Box>
    );
};
