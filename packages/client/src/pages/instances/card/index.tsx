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
    Spinner,
    Stack,
    Text,
    Tooltip,
    useBreakpointValue,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React from 'react';
import {
    FiCpu,
    FiInfo,
    FiMoreVertical,
    FiPlay,
    FiPower,
    FiRefreshCw,
    FiTrash,
} from 'react-icons/fi';
import { IconType } from 'react-icons';
import relativeTime from 'dayjs/plugin/relativeTime';
import { BiBookBookmark, BiHdd } from 'react-icons/bi';
import { BsGpuCard } from 'react-icons/bs';
import { LiaMemorySolid } from 'react-icons/lia';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { InstancesPageCardDetailsModal } from './details-modal';
import { Instance } from '../../../services/api-protocols';
import {
    bytesToHumanReadable,
    getInstancePlatformIcon,
    pluralize,
    translateNetworkPerformance,
} from '../../../services/helpers';
import { InstanceStateTag } from '../../../components/instance-state-tag';
import { useInstanceOperations } from '../../../hooks/use-instance-operations';
import { ConfirmDeletionAlertDialog } from '../../../components/confirm-deletion-alert-dialog';
import { useAuthSessionData } from '../../../hooks/use-auth-session-data';
import { useInstanceConnectionData } from '../../../hooks/use-instance-connection-data';
import { useNavigate } from 'react-router-dom';
import { InstancesPageCardCreateTemplateModal } from './create-template-modal';
import { FaNetworkWired } from 'react-icons/fa';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('pt-br');

interface InstancesPageCardProps {
    instance: Instance;
    isDisabled: boolean;
}

export const InstancesPageCard: React.FC<InstancesPageCardProps> = ({ instance, isDisabled }) => {
    const { authSessionData } = useAuthSessionData();
    const detailsModalDisclosure = useDisclosure();
    const createTemplateModalDisclosure = useDisclosure();
    const confirmDeletionDisclosure = useDisclosure();
    const { deleteInstance, rebootInstance, turnInstanceOn, turnInstanceOff } =
        useInstanceOperations();
    const { getInstanceConnection } = useInstanceConnectionData({ instanceId: instance.id });
    const navigate = useNavigate();
    const toast = useToast();

    const [state, setState] = React.useState<Instance['state']>('PENDING');

    const isPending =
        deleteInstance.isPending ||
        rebootInstance.isPending ||
        turnInstanceOn.isPending ||
        turnInstanceOff.isPending ||
        getInstanceConnection.isLoading;

    const gridItems: { icon: IconType; label: string; value: string }[] = [
        {
            icon: FiCpu,
            label: 'CPU',
            value: `${pluralize(instance.instanceType.cpu.cores, 'core', 'cores')}, ${pluralize(instance.instanceType.cpu.vCpus, 'vCPU', 'vCPUs')}, @ ${instance.instanceType.cpu.clockSpeedInGhz} GHz (${instance.instanceType.cpu.manufacturer})`,
        },
        {
            icon: getInstancePlatformIcon(instance.platform),
            label: 'Sistema operacional',
            value: instance.distribution,
        },
        {
            icon: BiHdd,
            label: 'Armazenamento',
            value: bytesToHumanReadable(parseInt(instance.storageInGb), 'GB'),
        },
        {
            icon: FaNetworkWired,
            label: 'Performance de rede',
            value: translateNetworkPerformance(instance.instanceType.networkPerformance),
        },
        {
            icon: LiaMemorySolid,
            label: 'Memória RAM',
            value: bytesToHumanReadable(instance.instanceType.ram.sizeInMb, 'MB'),
        },
        {
            icon: BsGpuCard,
            label: 'Memória de vídeo',
            value:
                instance.instanceType.gpu.totalGpuMemoryInMb !== 0
                    ? `${bytesToHumanReadable(instance.instanceType.gpu.totalGpuMemoryInMb, 'MB')} (${
                          instance.instanceType.gpu.devices.length > 0
                              ? instance.instanceType.gpu.devices
                                    .map(
                                        (device) =>
                                            `${device.count}x ${device.manufacturer} ${device.name} - ${bytesToHumanReadable(device.memoryInMb, 'MB')}`,
                                    )
                                    .join(', ')
                              : 'Nenhum dispositivo'
                      })`
                    : 'N/A',
        },
    ];

    React.useEffect(() => {
        setState(instance.state);
    }, [instance.state]);

    return (
        <Card
            borderRadius='xl'
            boxShadow='md'
            overflow='hidden'
            width={{ base: '100%' }}
            height={{ base: '100%' }}
            p={4}
            margin='auto'
        >
            <ConfirmDeletionAlertDialog
                title={`Excluir instância "${instance.name}"`}
                text={`Você tem certeza que deseja excluir a instância? Esta ação não poderá ser desfeita.`}
                isLoading={deleteInstance.isPending}
                isOpen={confirmDeletionDisclosure.isOpen}
                onClose={confirmDeletionDisclosure.onClose}
                onConfirm={() => deleteInstance.mutate({ instanceId: instance.id })}
            />

            <InstancesPageCardCreateTemplateModal
                instance={instance}
                isOpen={createTemplateModalDisclosure.isOpen}
                onClose={createTemplateModalDisclosure.onClose}
            />

            <InstancesPageCardDetailsModal
                instance={instance}
                isOpen={detailsModalDisclosure.isOpen}
                onClose={detailsModalDisclosure.onClose}
            />

            <CardHeader textAlign='center'>
                <Heading
                    size='lg'
                    noOfLines={2}
                >
                    {instance.name}
                </Heading>

                <Text
                    size='lg'
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
                    <InstanceStateTag state={state ?? 'PROVISIONING'} />
                    <Divider orientation='horizontal' />
                </Stack>

                <SimpleGrid
                    columns={{ base: 1, md: 2 }}
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
                        hidden={state !== 'RUNNING'}
                        isDisabled={isDisabled || isPending}
                        isLoading={
                            getInstanceConnection.isLoading || getInstanceConnection.isFetching
                        }
                        onClick={() => {
                            getInstanceConnection
                                .refetch()
                                .then((data) => {
                                    const connectionString = data.data?.connectionString;
                                    if (!connectionString) {
                                        throw new Error('Connection string not found');
                                    }

                                    const encodedConnectionString =
                                        encodeURIComponent(connectionString);

                                    navigate(
                                        `/connection?connectionString=${encodedConnectionString}`,
                                        {
                                            state: {
                                                instanceName: instance.name,
                                            },
                                        },
                                    );
                                })
                                .catch((error) => {
                                    const messageMap: Record<string, string> = {
                                        'Business rule violation: Instance has not been launched yet':
                                            'A instância ainda não foi configurada',
                                        'Business rule violation: Instance is being prepared for connection':
                                            'A instância está sendo preparada para conexão',
                                        'Business rule violation: Instance is not ready yet':
                                            'A instância ainda não está pronta',
                                    };

                                    const mappedMessage =
                                        messageMap[error instanceof Error ? error.message : ''];

                                    const defaultMessage =
                                        'Ocorreu um erro ao obter os dados de conexão da instância. Tente novamente em alguns minutos';

                                    toast({
                                        title: 'Ainda não é possível conectar-se à instância',
                                        description: mappedMessage ?? defaultMessage,
                                        status: mappedMessage ? 'info' : 'error',
                                        duration: 5000,
                                        isClosable: true,
                                    });
                                });
                        }}
                    >
                        Conectar
                    </Button>
                    {useBreakpointValue({ base: true, md: false }) ? (
                        <IconButton
                            icon={<FiPower />}
                            aria-label='Desligar'
                            size={'lg'}
                            colorScheme='red'
                            hidden={state !== 'RUNNING'}
                            isLoading={turnInstanceOff.isPending}
                            isDisabled={isDisabled || isPending}
                            onClick={() => {
                                turnInstanceOff.mutate(
                                    { instanceId: instance.id },
                                    {
                                        onSuccess(data) {
                                            setState(data?.state);
                                        },
                                    },
                                );
                            }}
                        />
                    ) : (
                        <Button
                            leftIcon={<FiPower />}
                            size={'lg'}
                            colorScheme='red'
                            hidden={state !== 'RUNNING'}
                            isLoading={turnInstanceOff.isPending}
                            isDisabled={isDisabled || isPending}
                            onClick={() => {
                                turnInstanceOff.mutate(
                                    { instanceId: instance.id },
                                    {
                                        onSuccess(data) {
                                            setState(data?.state);
                                        },
                                    },
                                );
                            }}
                        >
                            Desligar
                        </Button>
                    )}

                    <Button
                        leftIcon={<FiPower />}
                        size={'lg'}
                        colorScheme='green'
                        hidden={state !== 'STOPPED'}
                        isLoading={turnInstanceOn.isPending}
                        isDisabled={isDisabled || isPending}
                        onClick={() =>
                            turnInstanceOn.mutate(
                                { instanceId: instance.id },
                                {
                                    onSuccess(data) {
                                        setState(data?.state);
                                    },
                                },
                            )
                        }
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
                                isDisabled={isDisabled}
                            >
                                Detalhes
                            </MenuItem>

                            {authSessionData?.role === 'ADMIN' && (
                                <Tooltip
                                    label={
                                        (state !== 'STOPPED' || isDisabled || isPending) &&
                                        'A instância precisa estar desligada para criar um template'
                                    }
                                >
                                    <MenuItem
                                        icon={<BiBookBookmark />}
                                        isDisabled={state !== 'STOPPED' || isDisabled || isPending}
                                        onClick={createTemplateModalDisclosure.onOpen}
                                    >
                                        Criar template
                                    </MenuItem>
                                </Tooltip>
                            )}

                            <MenuItem
                                icon={
                                    rebootInstance.isPending ? (
                                        <Spinner
                                            size={'sm'}
                                            color={'gray'}
                                        />
                                    ) : (
                                        <FiRefreshCw />
                                    )
                                }
                                isDisabled={state !== 'RUNNING' || isDisabled || isPending}
                                onClick={() => rebootInstance.mutate({ instanceId: instance.id })}
                            >
                                Reiniciar
                            </MenuItem>

                            <MenuItem
                                icon={<FiTrash />}
                                textColor={'red.400'}
                                isDisabled={isDisabled || isPending}
                                onClick={confirmDeletionDisclosure.onOpen}
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
