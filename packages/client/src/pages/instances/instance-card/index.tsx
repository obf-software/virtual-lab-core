import {
    Button,
    ButtonGroup,
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
    const { getConnectionString } = useInstancesContext();
    const { connect } = useConnectionContext();
    const navigate = useNavigate();

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

    return (
        <Card>
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
                    mt={'2%'}
                >
                    <Icon
                        aria-label={platformStyle.label}
                        as={platformStyle.icon}
                        boxSize={'20px'}
                    />
                    <Text size={'md'}>{instance.distribution}</Text>
                </Stack>

                <Wrap mt={'2%'}>
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
                <ButtonGroup>
                    <Button
                        leftIcon={<FiPlay />}
                        colorScheme='green'
                        hidden={instance.state !== 'pending' && instance.state !== 'running'}
                        isDisabled={instance.state !== 'running'}
                        onClick={() => {
                            getConnectionString(instance.id)
                                .then((connectionString) => {
                                    connect(connectionString);
                                    navigate('/connection');
                                })
                                .catch((error) => {
                                    alert(`Erro ao obter string de conexão: ${error}`);
                                });
                        }}
                    >
                        Conectar
                    </Button>

                    <Button
                        leftIcon={<FiPower />}
                        colorScheme='red'
                        hidden={instance.state !== 'pending' && instance.state !== 'running'}
                        isDisabled={instance.state !== 'running'}
                    >
                        Desligar
                    </Button>

                    <Button
                        leftIcon={<FiPower />}
                        colorScheme='green'
                        transition={'all 1s'}
                        hidden={instance.state !== 'stopped' && instance.state !== 'stopping'}
                        isDisabled={instance.state !== 'stopped'}
                    >
                        Ligar
                    </Button>

                    <Button
                        leftIcon={<FiRefreshCw />}
                        colorScheme='blackAlpha'
                        hidden={!isMoreOptionsOpen || instance.state !== 'running'}
                        transition={'all 1s'}
                    >
                        Reiniciar
                    </Button>

                    <Button
                        leftIcon={<FiTrash />}
                        colorScheme='red'
                        hidden={!isMoreOptionsOpen}
                        transition={'all 1s'}
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
                </ButtonGroup>
            </CardFooter>
        </Card>
    );
};
