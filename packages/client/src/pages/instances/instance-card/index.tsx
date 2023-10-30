import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Heading,
    Icon,
    IconButton,
    Spinner,
    Stack,
    StackDivider,
    Tag,
    Text,
    Wrap,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React from 'react';
import {
    FiChevronsLeft,
    FiMoreVertical,
    FiPlay,
    FiPower,
    FiRefreshCw,
    FiTrash,
} from 'react-icons/fi';
import { FaLinux, FaQuestion, FaWindows } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { Instance, VirtualInstanceState } from '../../../services/api/protocols';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ConfirmDeletionAlertDialog } from '../../../components/confirm-deletion-alert-dialog/index';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as api from '../../../services/api/service';
import { queryClient } from '../../../services/query/service';
import { useNotificationsContext } from '../../../contexts/notifications/hook';
import { getErrorMessage } from '../../../services/helpers';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const instanceStateStyleMap: Record<
    keyof typeof VirtualInstanceState | 'unknown' | 'provisioning',
    { label: string; colorScheme: string; hasSpinner: boolean }
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
    unknown: {
        label: 'Desconhecido',
        colorScheme: 'gray',
        hasSpinner: false,
    },
    provisioning: {
        label: 'Provisionando',
        colorScheme: 'orange',
        hasSpinner: true,
    },
};

const instancePlatformStyleMap: Record<
    'LINUX' | 'WINDOWS' | 'UNKNOWN',
    { label: string; icon: IconType }
> = {
    LINUX: {
        label: 'Linux',
        icon: FaLinux as IconType,
    },
    WINDOWS: {
        label: 'Windows',
        icon: FaWindows as IconType,
    },
    UNKNOWN: {
        label: 'Desconhecido',
        icon: FaQuestion as IconType,
    },
};

interface InstanceCardProps {
    instance: Instance;
}

export const InstanceCard: React.FC<InstanceCardProps> = ({ instance }) => {
    const { registerHandler, unregisterHandlerById } = useNotificationsContext();
    const [isWaitingForInstanceStateChange, setIsWaitingForInstanceStateChange] =
        React.useState<boolean>(false);
    const moreOptionsDisclosure = useDisclosure();
    const confirmDeletionAlertDialogDisclosure = useDisclosure();
    const navigate = useNavigate();
    const toast = useToast();

    const stateStyle =
        instance.logicalId === null
            ? instanceStateStyleMap.provisioning
            : Object.keys(instanceStateStyleMap).includes(instance.state ?? 'unknown')
            ? instanceStateStyleMap[instance.state ?? 'unknown']
            : instanceStateStyleMap.unknown;

    let platformStyle = instancePlatformStyleMap.UNKNOWN;
    if (instance.platform?.toLocaleLowerCase().includes('linux')) {
        platformStyle = instancePlatformStyleMap.LINUX;
    } else if (instance.platform?.toLocaleLowerCase().includes('windows')) {
        platformStyle = instancePlatformStyleMap.WINDOWS;
    }

    const instanceConnectionQuery = useQuery({
        queryKey: ['instanceConnection', instance.id],
        queryFn: async () => {
            const response = await api.getInstanceConnection('me', instance.id);
            if (response.error !== undefined) throw new Error(response.error);
            return response.data;
        },
        enabled: instance.logicalId !== null && instance.state === 'RUNNING',
        staleTime: 1000 * 60 * 5,
    });

    const turnInstanceOnMutation = useMutation({
        mutationFn: async () => {
            const response = await api.turnInstanceOn('me', instance.id);
            if (response.error !== undefined) throw new Error(response.error);
        },
        retry: 1,
    });

    const turnInstanceOffMutation = useMutation({
        mutationFn: async () => {
            const response = await api.turnInstanceOff('me', instance.id);
            if (response.error !== undefined) throw new Error(response.error);
        },
        retry: 1,
    });

    const rebootInstanceMutation = useMutation({
        mutationFn: async () => {
            const response = await api.rebootInstance('me', instance.id);
            if (response.error !== undefined) throw new Error(response.error);
        },
        retry: 1,
    });

    const deleteInstanceMutation = useMutation({
        mutationFn: async () => {
            const response = await api.deleteInstance('me', instance.id);
            if (response.error !== undefined) throw new Error(response.error);
        },
        onSuccess: () => {
            // TODO: Use optimistic updates
            queryClient.invalidateQueries(['instances']).catch(console.error);
        },
        onError: (error) => {
            toast({
                title: 'Erro ao mudar o estado da instância',
                description: getErrorMessage(error),
                status: 'error',
                duration: 5000,
                isClosable: true,
                position: 'bottom-left',
                variant: 'left-accent',
            });
        },
        retry: 1,
    });

    const isLoading =
        rebootInstanceMutation.isLoading ||
        turnInstanceOffMutation.isLoading ||
        turnInstanceOnMutation.isLoading ||
        deleteInstanceMutation.isLoading ||
        isWaitingForInstanceStateChange;

    React.useEffect(() => {
        const handlerId = registerHandler('INSTANCE_STATE_CHANGED', (data) => {
            console.log('INSTANCE_STATE_CHANGED', data);

            if (data.instance.id === instance.id) {
                setIsWaitingForInstanceStateChange(false);
            }
        });

        return () => {
            unregisterHandlerById(handlerId);
        };
    }, []);

    return (
        <Card>
            <ConfirmDeletionAlertDialog
                title='Excluir Instância'
                text={`Você tem certeza que deseja deletar a instância ${instance.name}? Essa ação não pode ser desfeita e todos os dados serão perdidos.`}
                isOpen={confirmDeletionAlertDialogDisclosure.isOpen}
                onClose={confirmDeletionAlertDialogDisclosure.onClose}
                isLoading={isLoading}
                onConfirm={() => {
                    deleteInstanceMutation.mutate();
                }}
            />
            <CardHeader>
                <Stack
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 5, md: 10 }}
                >
                    <Heading size='xl'>{instance.name}</Heading>
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
                </Stack>
            </CardHeader>
            <CardBody>
                <Heading size={'md'}>{instance.description}</Heading>

                <Stack
                    direction='row'
                    align='center'
                    mt={'5%'}
                    hidden={instance.logicalId === null}
                >
                    <Icon
                        aria-label={platformStyle.label}
                        as={platformStyle.icon}
                        boxSize={'20px'}
                    />
                    <Text size={'md'}>{instance.distribution}</Text>
                </Stack>

                <Wrap
                    mt={'5%'}
                    hidden={instance.logicalId === null}
                >
                    {[
                        ['Tipo', instance.instanceType ?? '-'],
                        ['CPU', instance.cpuCores ? `${instance.cpuCores} vCPU` : '-'],
                        ['Memória', instance.memoryInGb ? `${instance.memoryInGb} GB` : '-'],
                        [
                            'Armazenamento',
                            instance.storageInGb ? `${instance.storageInGb} GB` : '-',
                        ],
                        ['Conexão', instance.connectionType ?? '-'],
                        ['Criada em', dayjs(instance.createdAt).format('DD/MM/YYYY')],
                        [
                            'Último acesso',
                            instance.lastConnectionAt !== null
                                ? dayjs(instance.lastConnectionAt).fromNow()
                                : 'Nunca',
                        ],
                    ].map(([label, value]) => (
                        <Stack
                            key={label}
                            direction='row'
                            spacing={2}
                            align='center'
                        >
                            <Text
                                fontSize='md'
                                color='gray.600'
                            >
                                {label}
                            </Text>
                            <Text
                                fontSize='md'
                                color='gray.900'
                            >
                                {value}
                            </Text>
                            <StackDivider />
                        </Stack>
                    ))}
                </Wrap>
            </CardBody>
            <CardFooter hidden={instance.logicalId === null}>
                <Wrap spacingY={4}>
                    <Button
                        leftIcon={<FiPlay />}
                        colorScheme='green'
                        hidden={
                            (instance.state !== 'PENDING' && instance.state !== 'RUNNING') ||
                            instance.logicalId === null
                        }
                        isDisabled={instance.state !== 'RUNNING'}
                        isLoading={
                            isLoading ||
                            instanceConnectionQuery.isLoading ||
                            instanceConnectionQuery.isFetching
                        }
                        onClick={() => {
                            if (
                                instanceConnectionQuery.isError ||
                                instanceConnectionQuery.data === undefined
                            ) {
                                toast({
                                    title: 'Erro ao conectar',
                                    description: getErrorMessage(instanceConnectionQuery.error),
                                    status: 'error',
                                    duration: 5000,
                                    isClosable: true,
                                    position: 'bottom-left',
                                    variant: 'left-accent',
                                });
                                return;
                            }

                            const encodedConnectionString = encodeURIComponent(
                                instanceConnectionQuery.data.connectionString,
                            );
                            navigate(`/connection?connectionString=${encodedConnectionString}`);
                        }}
                    >
                        Conectar
                    </Button>

                    <Button
                        leftIcon={<FiPower />}
                        colorScheme='red'
                        hidden={
                            (instance.state !== 'PENDING' && instance.state !== 'RUNNING') ||
                            instance.logicalId === null
                        }
                        isDisabled={instance.state !== 'RUNNING'}
                        isLoading={isLoading}
                        onClick={() => {
                            setIsWaitingForInstanceStateChange(true);
                            turnInstanceOffMutation.mutate();
                        }}
                    >
                        Desligar
                    </Button>

                    <Button
                        leftIcon={<FiPower />}
                        colorScheme='green'
                        transition={'all 1s'}
                        hidden={
                            (instance.state !== 'STOPPED' && instance.state !== 'STOPPING') ||
                            instance.logicalId === null
                        }
                        isDisabled={instance.state !== 'STOPPED'}
                        isLoading={isLoading}
                        onClick={() => {
                            setIsWaitingForInstanceStateChange(true);
                            turnInstanceOnMutation.mutate();
                        }}
                    >
                        Ligar
                    </Button>

                    <Button
                        leftIcon={<FiRefreshCw />}
                        colorScheme='blackAlpha'
                        hidden={
                            !moreOptionsDisclosure.isOpen ||
                            instance.logicalId === null ||
                            instance.state !== 'RUNNING'
                        }
                        isLoading={isLoading}
                        onClick={() => {
                            rebootInstanceMutation.mutate();
                        }}
                    >
                        Reiniciar
                    </Button>

                    <Button
                        leftIcon={<FiTrash />}
                        colorScheme='red'
                        hidden={
                            !moreOptionsDisclosure.isOpen ||
                            instance.logicalId === null ||
                            instance.state === 'STOPPING' ||
                            instance.state === 'PENDING'
                        }
                        isLoading={isLoading}
                        onClick={confirmDeletionAlertDialogDisclosure.onOpen}
                    >
                        Excluir
                    </Button>

                    <IconButton
                        aria-label='Mais opções'
                        variant={'outline'}
                        colorScheme='blue'
                        hidden={
                            instance.state === 'STOPPING' ||
                            instance.state === 'PENDING' ||
                            instance.logicalId === null ||
                            isLoading
                        }
                        icon={
                            moreOptionsDisclosure.isOpen ? <FiChevronsLeft /> : <FiMoreVertical />
                        }
                        onClick={() => moreOptionsDisclosure.onToggle()}
                    />
                </Wrap>
            </CardFooter>
        </Card>
    );
};
