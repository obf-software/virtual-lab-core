import {
    Card,
    CardBody,
    CardHeader,
    Heading,
    Icon,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
} from '@chakra-ui/react';
import { InstanceType } from '../../../../services/api-protocols';
import React from 'react';
import { IconType } from 'react-icons';
import { FiCpu } from 'react-icons/fi';
import {
    bytesToHumanReadable,
    pluralize,
    translateNetworkPerformance,
} from '../../../../services/helpers';
import { FaNetworkWired } from 'react-icons/fa';
import { LiaMemorySolid } from 'react-icons/lia';
import { BsGpuCard } from 'react-icons/bs';
import { GiNightSleep } from 'react-icons/gi';

interface ProfilePageQuotaCardInstanceTypeCardProps {
    instanceType: InstanceType;
}

export const ProfilePageQuotaCardInstanceTypeCard: React.FC<
    ProfilePageQuotaCardInstanceTypeCardProps
> = ({ instanceType }) => {
    const gridItems: { icon: IconType; label: string; value: string }[] = [
        {
            icon: FiCpu,
            label: 'CPU',
            value: `${pluralize(instanceType.cpu.cores, 'Core', 'Cores')}, ${pluralize(instanceType.cpu.vCpus, 'vCPU', 'vCPUs')}, @ ${instanceType.cpu.clockSpeedInGhz} GHz (${instanceType.cpu.manufacturer})`,
        },
        {
            icon: FaNetworkWired,
            label: 'Performance de rede',
            value: translateNetworkPerformance(instanceType.networkPerformance),
        },
        {
            icon: LiaMemorySolid,
            label: 'Memória RAM',
            value: bytesToHumanReadable(instanceType.ram.sizeInMb, 'MB'),
        },
        {
            icon: BsGpuCard,
            label: 'Memória de vídeo',
            value:
                instanceType.gpu.totalGpuMemoryInMb !== 0
                    ? `${bytesToHumanReadable(instanceType.gpu.totalGpuMemoryInMb, 'MB')} (${
                          instanceType.gpu.devices.length > 0
                              ? instanceType.gpu.devices
                                    .map(
                                        (device) =>
                                            `${device.count}x ${device.manufacturer} ${device.name} - ${bytesToHumanReadable(device.memoryInMb, 'MB')}`,
                                    )
                                    .join(', ')
                              : 'Nenhum dispositivo'
                      })`
                    : 'N/A',
        },
        {
            icon: GiNightSleep,
            label: 'Hibernação',
            value: `Hibernação ${instanceType.hibernationSupport ? ' ' : 'não '}suportada`,
        },
    ];

    return (
        <Card
            w={'full'}
            borderRadius={12}
            boxShadow={'lg'}
            borderColor={'gray.100'}
            borderWidth={2}
        >
            <CardHeader>
                <Heading
                    size={'md'}
                    color='gray.800'
                >
                    {instanceType.name}
                </Heading>
            </CardHeader>

            <CardBody>
                <SimpleGrid spacing={2}>
                    {gridItems.map(({ icon, label, value }, index) => (
                        <Tooltip
                            label={`${label}: ${value}`}
                            key={`instance-grid-item-${index}`}
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
                                    fontSize={'md'}
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
        </Card>
    );
};
