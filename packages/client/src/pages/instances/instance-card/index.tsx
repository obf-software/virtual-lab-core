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
import { FiMoreVertical, FiPlay } from 'react-icons/fi';
import { FaLinux, FaWindows } from 'react-icons/fa';
import { IconType } from 'react-icons';

enum InstanceStatus {
    PENDENTE = 'PENDENTE',
    ATIVA = 'RODANDO',
    DESLIGANDO = 'DESLIGANDO',
    DESLIGADA = 'DESLIGADA',

    EXCLUINDO = 'EXCLUINDO',
    EXCLUIDA = 'EXCLUIDA',
}

enum InstanceConnectionType {
    SSH = 'SSH',
    RDP = 'RDP',
    VNC = 'VNC',
}

const instanceStatusColors: Record<
    keyof typeof InstanceStatus,
    {
        colorScheme: string;
        hasSpinner: boolean;
    }
> = {
    PENDENTE: { colorScheme: 'orange', hasSpinner: true },
    ATIVA: { colorScheme: 'green', hasSpinner: false },
    DESLIGANDO: { colorScheme: 'red', hasSpinner: true },
    DESLIGADA: { colorScheme: 'red', hasSpinner: false },

    EXCLUINDO: { colorScheme: 'gray', hasSpinner: true },
    EXCLUIDA: { colorScheme: 'gray', hasSpinner: false },
};

enum InstanceSO {
    LINUX = 'LINUX',
    WINDOWS = 'WINDOWS',
}

interface InstanceCardProps {
    status: keyof typeof InstanceStatus;
    connectionType?: keyof typeof InstanceConnectionType;
}

export const InstanceCard: React.FC<InstanceCardProps> = ({ status, connectionType }) => {
    const displayName = 'Instância padrão';
    const createdAt = new Date().toISOString();
    const instanceType = 't2.micro';
    const cpu = '1 vCPU';
    const memory = '1 GB';
    const storage = '30 GB';
    const so: keyof typeof InstanceSO = 'LINUX';
    const soVersion = 'Ubuntu 20.04';
    const softwares = ['Node.js 14.17.0', 'Nginx 1.18.0', 'MongoDB 4.4.6'];

    return (
        <Card>
            <CardHeader>
                <Stack
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 5, md: 10 }}
                >
                    <Heading size='md'>{displayName}</Heading>
                    <Tag colorScheme={instanceStatusColors[status].colorScheme}>
                        <Stack
                            direction='row'
                            spacing={1}
                            align='center'
                        >
                            <Text>{status}</Text>
                            {instanceStatusColors[status].hasSpinner && <Spinner size='xs' />}
                        </Stack>
                    </Tag>
                </Stack>
            </CardHeader>
            <CardBody>
                <Stack
                    direction='row'
                    spacing={1}
                    align='center'
                    mb={5}
                >
                    <Icon
                        as={(so === 'LINUX' ? FaLinux : FaWindows) as IconType}
                        boxSize={'40px'}
                    />
                    <Heading size={'lg'}>{soVersion}</Heading>
                </Stack>

                <Wrap>
                    {[
                        ['Tipo', instanceType],
                        ['CPU', cpu],
                        ['Memória', memory],
                        ['Armazenamento', storage],
                        ['Conexão', connectionType ?? 'SSH'],
                        ['Criada em', dayjs(createdAt).format('DD/MM/YYYY')],
                    ].map(([label, value]) => (
                        <Stack
                            key={label}
                            direction='row'
                            spacing={1}
                            align='center'
                        >
                            <Text
                                fontSize='sm'
                                color='gray.600'
                            >
                                {label}
                            </Text>
                            <Text
                                fontSize='sm'
                                color='gray.900'
                            >
                                {value}
                            </Text>
                            <StackDivider />
                        </Stack>
                    ))}
                </Wrap>

                <Heading
                    size={'sm'}
                    mt={5}
                    mb={2}
                >
                    Softwares
                </Heading>
                <Wrap>
                    {softwares.map((software) => (
                        <Tag
                            key={software}
                            colorScheme='blue'
                            size='sm'
                        >
                            {software}
                        </Tag>
                    ))}
                </Wrap>
            </CardBody>
            <CardFooter>
                <ButtonGroup>
                    <Button
                        leftIcon={<FiPlay />}
                        colorScheme='green'
                    >
                        Conectar
                    </Button>

                    <IconButton
                        aria-label='Mais opções'
                        variant={'outline'}
                        colorScheme='gray'
                        icon={<FiMoreVertical />}
                    />
                </ButtonGroup>
            </CardFooter>
        </Card>
    );
};
