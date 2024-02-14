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
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
    useBreakpointValue,
    useDisclosure,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React from 'react';
import {
    FiCalendar,
    FiClock,
    FiCpu,
    FiInfo,
    FiMoreVertical,
    FiPlay,
    FiPower,
    FiRefreshCw,
    FiTrash,
} from 'react-icons/fi';
import { FaLinux, FaQuestion, FaWindows } from 'react-icons/fa';
import { IconType } from 'react-icons';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { Instance } from '../../services/api-protocols';
import { InstanceCardStateTag } from './status-tag';
import { BiHdd, BiMicrochip } from 'react-icons/bi';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { InstanceDetailsModal } from '../instance-details-modal';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('pt-br');

interface InstanceCardProps {
    instance: Instance;
    isLoading: boolean;
    isDisabled: boolean;
    onConnect?: () => void;
    onPowerOff?: () => void;
    onPowerOn?: () => void;
    onReboot?: () => void;
    onDelete?: () => void;
}

export const InstanceCard: React.FC<InstanceCardProps> = ({
    instance,
    isLoading,
    isDisabled,
    onConnect,
    onPowerOff,
    onPowerOn,
    onReboot,
    onDelete,
}) => {
    const detailsModalDisclosure = useDisclosure();

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
            value: instance.storageInGb ? `${instance.storageInGb} GB` : '-',
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
            width={{ base: '100%' }}
            p={4}
            margin='auto'
        >
            <CardHeader textAlign='center'>
                <Heading
                    size='lg'
                    noOfLines={2}
                >
                    {instance.name}
                </Heading>

                <Text
                    size='md'
                    color='gray.600'
                    mt={5}
                    noOfLines={3}
                >
                    {instance.description}
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
                <ButtonGroup>
                    <Button
                        leftIcon={<FiPlay />}
                        size={'lg'}
                        colorScheme='green'
                        hidden={instance.state !== 'RUNNING'}
                        isLoading={isLoading}
                        isDisabled={isDisabled}
                        onClick={onConnect}
                    >
                        Conectar
                    </Button>
                    {useBreakpointValue({ base: true, md: false }) ? (
                        <IconButton
                            icon={<FiPower />}
                            aria-label='Desligar'
                            size={'lg'}
                            colorScheme='red'
                            hidden={instance.state !== 'RUNNING'}
                            isLoading={isLoading}
                            isDisabled={isDisabled}
                            onClick={onPowerOff}
                        />
                    ) : (
                        <Button
                            leftIcon={<FiPower />}
                            size={'lg'}
                            colorScheme='red'
                            hidden={instance.state !== 'RUNNING'}
                            isLoading={isLoading}
                            isDisabled={isDisabled}
                            onClick={onPowerOff}
                        >
                            Desligar
                        </Button>
                    )}

                    <Button
                        leftIcon={<FiPower />}
                        size={'lg'}
                        colorScheme='green'
                        hidden={instance.state !== 'STOPPED'}
                        isLoading={isLoading}
                        isDisabled={isDisabled}
                        onClick={onPowerOn}
                    >
                        Ligar
                    </Button>
                    <Menu>
                        <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            size={'lg'}
                            aria-label='Mais opções'
                            variant={'outline'}
                            colorScheme='blue'
                        />

                        <MenuList>
                            <MenuItem
                                icon={<FiInfo />}
                                onClick={detailsModalDisclosure.onOpen}
                                isDisabled={isLoading || isDisabled}
                            >
                                Detalhes
                                <InstanceDetailsModal
                                    instance={instance}
                                    isOpen={detailsModalDisclosure.isOpen}
                                    onClose={detailsModalDisclosure.onClose}
                                />
                            </MenuItem>

                            <MenuItem
                                isDisabled={instance.state !== 'RUNNING' || isLoading || isDisabled}
                                icon={<FiRefreshCw />}
                                onClick={onReboot}
                            >
                                Reiniciar
                            </MenuItem>

                            <MenuItem
                                icon={<FiTrash />}
                                textColor={'red.400'}
                                isDisabled={isLoading || isDisabled}
                                onClick={onDelete}
                            >
                                Excluir
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </ButtonGroup>
            </CardFooter>
        </Card>
    );
};
