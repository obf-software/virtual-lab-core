import {
    Button,
    ButtonGroup,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Divider,
    Heading,
    Icon,
    IconButton,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React from 'react';
import { FiCalendar, FiClock, FiCpu, FiMoreVertical, FiPlay, FiPower } from 'react-icons/fi';
import { FaLinux, FaQuestion, FaWindows } from 'react-icons/fa';
import { IconType } from 'react-icons';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { Instance } from '../../services/api-protocols';
import { InstanceCardStateTag } from './status-tag';
import { BiHdd, BiMicrochip } from 'react-icons/bi';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('pt-br');

interface InstanceCardProps {
    instance: Instance;
    isLoading?: boolean;
}

export const InstanceCard: React.FC<InstanceCardProps> = ({ instance, isLoading }) => {
    const platformIconMap: Record<'LINUX' | 'WINDOWS' | 'UNKNOWN', IconType> = {
        LINUX: FaLinux,
        WINDOWS: FaWindows,
        UNKNOWN: FaQuestion,
    };

    let platformIcon = platformIconMap.UNKNOWN;
    if (instance.platform?.toLocaleLowerCase().includes('linux')) {
        platformIcon = platformIconMap.LINUX;
    } else if (instance.platform?.toLocaleLowerCase().includes('windows')) {
        platformIcon = platformIconMap.WINDOWS;
    }

    const gridItems: { icon: IconType; label: string; value: string }[] = [
        {
            icon: FiCpu,
            label: 'CPU',
            value: instance.cpuCores ? `${instance.cpuCores} vCPU` : '-',
        },
        {
            icon: platformIcon,
            label: 'Sistema operacional',
            value: instance.distribution ?? '-',
        },
        {
            icon: BiHdd,
            label: 'Armazenamento',
            value: instance.storageInGb
                ? `${instance.storageInGb} GBasdasda sdasdasdasdasdas`
                : '-',
        },
        {
            icon: FiClock,
            label: 'Último acesso',
            value: instance.lastConnectionAt
                ? dayjs(instance.lastConnectionAt, {
                      format: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
                  }).fromNow()
                : 'Nunca',
        },
        {
            icon: BiMicrochip,
            label: 'Memória',
            value: instance.memoryInGb ? `${instance.memoryInGb} GB` : '-',
        },

        {
            icon: FiCalendar,
            label: 'Criada em',
            value: dayjs(instance.createdAt).format('DD/MM/YYYY'),
        },
    ];

    return (
        <Card
            borderRadius='xl'
            boxShadow='md'
            overflow='hidden'
            // width='100%'
            width='lg'
            p={4}
            // margin='auto'
        >
            <CardHeader textAlign='center'>
                <Heading
                    size='lg'
                    noOfLines={2}
                >
                    Máquina de sistemas operacionais 2Máquina de sistemas operacionais 2Máquina de
                    sistemas operacionais 2Máquina de sistemas operacionais 2Máquina de sistemas
                    operacionais 2{/* {instance.name} */}
                </Heading>

                <Text
                    size='md'
                    color='gray.600'
                    mt={5}
                    noOfLines={3}
                >
                    Máquina de sistemas operacionais 2Máquina de sistemas operacionais 2Máquina de
                    sistemas operacionais 2Máquina de sistemas operacionais 2Máquina de sistemas
                    operacionais 2Máquina de sistemas operacionais 2Máquina de sistemas operacionais
                    2Máquina de sistemas operacionais 2Máquina de sistemas operacionais 2Máquina de
                    sistemas operacionais 2{/* {instance.description} */}
                </Text>
            </CardHeader>

            <CardBody>
                <Stack
                    direction='row'
                    align='center'
                    spacing={4}
                >
                    <Divider orientation='horizontal' />
                    <InstanceCardStateTag
                        state={!instance.virtualId ? 'PROVISIONING' : instance.state}
                    />
                    <Divider orientation='horizontal' />
                </Stack>

                <SimpleGrid
                    columns={2}
                    mt={6}
                    spacing={4}
                >
                    {gridItems.map(({ icon, label, value }, index) => (
                        <Tooltip
                            label={`${label}: ${value}`}
                            key={`instance-${instance.id}-grid-item-${index}`}
                        >
                            <Stack
                                key={value}
                                direction='row'
                                spacing={4}
                                align='center'
                            >
                                <Icon
                                    aria-label={value}
                                    as={icon}
                                    boxSize={'24px'}
                                />
                                <Text
                                    fontSize={'larger'}
                                    noOfLines={1}
                                    overflow={'clip'}
                                >
                                    {value}
                                </Text>
                            </Stack>
                        </Tooltip>
                    ))}
                </SimpleGrid>
            </CardBody>
            <CardFooter justifyContent='center'>
                {instance.virtualId === undefined ||
                    (instance.state === 'PENDING' && (
                        <Text color='gray.600'>Aguarde enquanto a máquina é provisionada</Text>
                    ))}

                {(instance.state === 'TERMINATED' || instance.state === 'SHUTTING_DOWN') && (
                    <Text color='gray.600'>A máquina foi excluída</Text>
                )}

                {(instance.state === 'RUNNING' ||
                    instance.state === 'STOPPED' ||
                    instance.state === 'STOPPING') && (
                    <ButtonGroup>
                        <Button
                            leftIcon={<FiPlay />}
                            size={'lg'}
                            colorScheme='green'
                            hidden={instance.state !== 'RUNNING'}
                            isLoading={isLoading}
                        >
                            Conectar
                        </Button>
                        <Button
                            leftIcon={<FiPower />}
                            size={'lg'}
                            colorScheme='red'
                            hidden={instance.state !== 'RUNNING'}
                            isLoading={isLoading}
                        >
                            Desligar
                        </Button>
                        <Button
                            leftIcon={<FiPower />}
                            size={'lg'}
                            colorScheme='green'
                            hidden={instance.state !== 'STOPPED'}
                            isLoading={isLoading}
                        >
                            Ligar
                        </Button>
                        <IconButton
                            icon={<FiMoreVertical />}
                            size={'lg'}
                            aria-label='Mais opções'
                            variant={'outline'}
                            colorScheme='blue'
                            hidden={isLoading}
                        />
                    </ButtonGroup>
                )}
            </CardFooter>
        </Card>
    );
};
