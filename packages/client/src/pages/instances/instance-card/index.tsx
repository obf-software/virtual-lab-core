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
import { useConnectionContext } from '../../../contexts/connection/hook';
import { Instance, InstanceState } from '../../../services/api/protocols';
import { useInstancesContext } from '../../../contexts/instances/hook';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    changeInstanceState,
    deleteInstance,
    getInstanceConnection,
} from '../../../services/api/service';
import { useNotificationsContext } from '../../../contexts/notifications/hook';
import { ConfirmDeletionModal } from './confirm-deletion-modal';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

const instanceStateStyleMap: Record<
    keyof typeof InstanceState | 'unknown',
    { label: string; colorScheme: string; hasSpinner: boolean }
> = {
    'shutting-down': {
        label: 'Terminando',
        colorScheme: 'red',
        hasSpinner: true,
    },
    pending: {
        label: 'Pendente',
        colorScheme: 'orange',
        hasSpinner: true,
    },
    running: {
        label: 'Ativa',
        colorScheme: 'green',
        hasSpinner: false,
    },
    stopped: {
        label: 'Desligada',
        colorScheme: 'red',
        hasSpinner: false,
    },
    stopping: {
        label: 'Desligando',
        colorScheme: 'red',
        hasSpinner: true,
    },
    terminated: {
        label: 'Excluída',
        colorScheme: 'gray',
        hasSpinner: false,
    },
    unknown: {
        label: 'Desconhecido',
        colorScheme: 'gray',
        hasSpinner: false,
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
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const { activePage, loadInstancesPage } = useInstancesContext();
    const { registerHandler, unregisterHandlerById } = useNotificationsContext();
    const { connect } = useConnectionContext();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const navigate = useNavigate();
    const toast = useToast();

    const stateStyle = Object.keys(instanceStateStyleMap).includes(instance.state ?? 'unknown')
        ? instanceStateStyleMap[instance.state ?? 'unknown']
        : instanceStateStyleMap.unknown;

    let platformStyle = instancePlatformStyleMap.UNKNOWN;
    if (instance.platform.toLocaleLowerCase().includes('linux')) {
        platformStyle = instancePlatformStyleMap.LINUX;
    } else if (instance.platform.toLocaleLowerCase().includes('windows')) {
        platformStyle = instancePlatformStyleMap.WINDOWS;
    }

    const tags = instance.tags?.split(',') ?? [];

    React.useEffect(() => {
        const handlerId = registerHandler('EC2_INSTANCE_STATE_CHANGED', (data) => {
            console.log('EC2_INSTANCE_STATE_CHANGED', data);

            if (data.id === instance.id) {
                setIsLoading(false);
            }
        });

        return () => {
            unregisterHandlerById(handlerId);
        };
    }, []);

    return (
        <Card>
            <ConfirmDeletionModal
                instanceName={instance.name}
                isOpen={isOpen}
                onClose={onClose}
                isLoading={isLoading}
                onConfirm={() => {
                    setIsLoading(true);
                    deleteInstance(undefined, instance.id)
                        .then(() => {
                            setIsLoading(false);
                            loadInstancesPage(activePage, 20).catch(console.error);
                        })
                        .catch((error) => {
                            setIsLoading(false);
                            toast({
                                title: 'Erro ao excluir instância',
                                description:
                                    error instanceof Error ? error.message : 'Erro desconhecido',
                                status: 'error',
                                duration: 5000,
                                isClosable: true,
                                position: 'bottom-left',
                                variant: 'left-accent',
                            });
                        });
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
                >
                    <Icon
                        aria-label={platformStyle.label}
                        as={platformStyle.icon}
                        boxSize={'20px'}
                    />
                    <Text size={'md'}>{instance.distribution}</Text>
                </Stack>

                <Wrap mt={'5%'}>
                    {[
                        ['Tipo', instance.instanceType],
                        ['CPU', `${instance.cpu} vCPU`],
                        ['Memória', `${instance.memoryInGb} GB`],
                        ['Armazenamento', `${instance.storageInGb} GB`],
                        ['Conexão', instance.connectionType],
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
                {tags.length > 0 ? (
                    <Wrap mt={'2%'}>
                        {tags?.map((tag, index) => (
                            <Tag
                                key={`tag-${tag}-${index}`}
                                colorScheme='blue'
                                size='md'
                                fontWeight={'black'}
                                variant={'outline'}
                            >
                                {tag}
                            </Tag>
                        ))}
                    </Wrap>
                ) : null}
            </CardBody>
            <CardFooter>
                <Wrap spacingY={4}>
                    <Button
                        leftIcon={<FiPlay />}
                        colorScheme='green'
                        hidden={instance.state !== 'pending' && instance.state !== 'running'}
                        isDisabled={instance.state !== 'running'}
                        isLoading={isLoading}
                        onClick={() => {
                            setIsLoading(true);
                            getInstanceConnection(undefined, instance.id)
                                .then(({ data, error }) => {
                                    setIsLoading(false);
                                    if (error !== undefined) {
                                        toast({
                                            title: 'Erro ao obter string de conexão',
                                            description: error,
                                            status: 'error',
                                            duration: 5000,
                                            isClosable: true,
                                            position: 'bottom-left',
                                            variant: 'left-accent',
                                        });
                                        return;
                                    }

                                    connect(data.connectionString);
                                    navigate('/connection');
                                })
                                .catch(console.error);
                        }}
                    >
                        Conectar
                    </Button>

                    <Button
                        leftIcon={<FiPower />}
                        colorScheme='red'
                        hidden={instance.state !== 'pending' && instance.state !== 'running'}
                        isDisabled={instance.state !== 'running'}
                        isLoading={isLoading}
                        onClick={() => {
                            setIsLoading(true);
                            changeInstanceState(undefined, instance.id, 'stop').catch((error) => {
                                toast({
                                    title: 'Erro ao desligar instância',
                                    description:
                                        error instanceof Error
                                            ? error.message
                                            : 'Erro desconhecido',
                                    status: 'error',
                                    duration: 5000,
                                    isClosable: true,
                                    position: 'bottom-left',
                                    variant: 'left-accent',
                                });
                                setIsLoading(false);
                            });
                        }}
                    >
                        Desligar
                    </Button>

                    <Button
                        leftIcon={<FiPower />}
                        colorScheme='green'
                        transition={'all 1s'}
                        hidden={instance.state !== 'stopped' && instance.state !== 'stopping'}
                        isDisabled={instance.state !== 'stopped'}
                        isLoading={isLoading}
                        onClick={() => {
                            setIsLoading(true);
                            changeInstanceState(undefined, instance.id, 'start').catch((error) => {
                                setIsLoading(false);
                                toast({
                                    title: 'Erro ao ligar instância',
                                    description:
                                        error instanceof Error
                                            ? error.message
                                            : 'Erro desconhecido',
                                    status: 'error',
                                    duration: 5000,
                                    isClosable: true,
                                    position: 'bottom-left',
                                    variant: 'left-accent',
                                });
                            });
                        }}
                    >
                        Ligar
                    </Button>

                    <Button
                        leftIcon={<FiRefreshCw />}
                        colorScheme='blackAlpha'
                        hidden={!isMoreOptionsOpen || instance.state !== 'running'}
                        isLoading={isLoading}
                        onClick={() => {
                            setIsLoading(true);
                            changeInstanceState(undefined, instance.id, 'reboot')
                                .then(() => {
                                    setIsLoading(false);
                                    toast({
                                        title: 'Instância reiniciada',
                                        description: 'A instância foi reiniciada com sucesso',
                                        status: 'success',
                                        duration: 5000,
                                        isClosable: true,
                                        position: 'bottom-left',
                                        variant: 'left-accent',
                                    });
                                })
                                .catch((error) => {
                                    setIsLoading(false);
                                    toast({
                                        title: 'Erro ao reiniciar instância',
                                        description:
                                            error instanceof Error
                                                ? error.message
                                                : 'Erro desconhecido',
                                        status: 'error',
                                        duration: 5000,
                                        isClosable: true,
                                        position: 'bottom-left',
                                        variant: 'left-accent',
                                    });
                                });
                        }}
                    >
                        Reiniciar
                    </Button>

                    <Button
                        leftIcon={<FiTrash />}
                        colorScheme='red'
                        hidden={!isMoreOptionsOpen}
                        isLoading={isLoading}
                        onClick={onOpen}
                    >
                        Exluir
                    </Button>

                    <IconButton
                        aria-label='Mais opções'
                        variant={'outline'}
                        colorScheme='blue'
                        hidden={instance.state === 'stopping' || instance.state === 'pending'}
                        icon={isMoreOptionsOpen ? <FiChevronsLeft /> : <FiMoreVertical />}
                        onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
                    />
                </Wrap>
            </CardFooter>
        </Card>
    );
};
