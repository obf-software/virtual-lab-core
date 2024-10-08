import { Box, Spinner, Stack, Tag, Text } from '@chakra-ui/react';
import React from 'react';
import { InstanceState } from '../../services/api-protocols';
import { instanceStateToDisplayString } from '../../services/helpers';

interface InstanceStateTagProps {
    state?: InstanceState | 'PROVISIONING';
}

export const InstanceStateTag: React.FC<InstanceStateTagProps> = ({ state }) => {
    const stateStyleMap: Record<
        InstanceState | 'UNKNOWN' | 'PROVISIONING',
        {
            label: string;
            colorScheme: string;
            hasSpinner: boolean;
        }
    > = {
        SHUTTING_DOWN: {
            label: instanceStateToDisplayString('SHUTTING_DOWN'),
            colorScheme: 'red',
            hasSpinner: true,
        },
        PENDING: {
            label: instanceStateToDisplayString('PENDING'),
            colorScheme: 'orange',
            hasSpinner: true,
        },
        RUNNING: {
            label: instanceStateToDisplayString('RUNNING'),
            colorScheme: 'green',
            hasSpinner: false,
        },
        STOPPED: {
            label: instanceStateToDisplayString('STOPPED'),
            colorScheme: 'red',
            hasSpinner: false,
        },
        STOPPING: {
            label: instanceStateToDisplayString('STOPPING'),
            colorScheme: 'red',
            hasSpinner: true,
        },
        TERMINATED: {
            label: instanceStateToDisplayString('TERMINATED'),
            colorScheme: 'gray',
            hasSpinner: false,
        },
        UNKNOWN: {
            label: instanceStateToDisplayString(),
            colorScheme: 'gray',
            hasSpinner: false,
        },
        PROVISIONING: {
            label: 'Configurando',
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
                transition='all .5s ease-in-out'
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
