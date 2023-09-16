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
import React, { useEffect } from 'react';
import { FiMoreVertical, FiPlay } from 'react-icons/fi';
import { FaLinux, FaWindows } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { useNavigate } from 'react-router-dom';
import { useConnectionContext } from '../../../contexts/connection/hook';

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

    const { connect, disconnect, connectionState } = useConnectionContext();

    const navigate = useNavigate();

    useEffect(() => {
        if (connectionState !== 'IDDLE') {
            disconnect();
        }
    }, []);

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
                        onClick={() => {
                            const success = connect(
                                'token=eyJpdiI6Ik9reFBLbVNuR1VMVUtSV2dQczVGb0E9PSIsInZhbHVlIjoiY3E0UG5NOHIvd1U3azdPczFYWDBYdnVtd0MrcjNkUkU5Q2lMOHY5NWZCcis2K2ZFSFlvblFQWEJCem9MdmVuNUVwVmNEd1dRaHlvUzdzY2xhbE94RFBZT3cra3hzaUdaRkljblRydW1RS2o0WTRwS0pqVXNBZ0xZdVZWVnF6b2RmQmVVTmlSSUphYUxQRHdRSkI1a0cyTUJEZkt0TGZvWkhZTXpnSllPQ0RnYTVOT3dkd01qRm9SbUx3QXhiV1hPTFRHZWd0MGVzK1hwckhIb0JiVzhZVC9saTVNOW1lSWVKS09UbExtTHBzQmZONk9SajB1QW5BclIwYndJZUlSVTE1WTgzSElOUURGSms1VlREeElGSkpKSGtIOU1neis5K3dHVHRIcmoyUDlvSzdyT2Ivd2M3YWN0czFBejZTWmVNUFpMdjYybzZTOG9pRmlnenRTaHlTdHdZdy9sRnFVWG84YzJvQ0tVM2NVdld5Zi9CTXB4RlFWcUlUREVIVjR4U29MSjZUS0tNY0ZSQjBRMjR2WkNUSEhqMkpUb0k1YURjRkhONkVrVG5QQlBTRktjTE1aK1VsSUhEZnlaczJaNzhJaFZkMXR2bnJmTDNrb3RMcFZxLzBBamxkRGw5UStudUdnRDVqYnUra1EzMUF4aVlFTUt3cGdjNEJTalJqbG5DMFNwdGcyRUhVM0wrUE5kVElNUm9qa1p0bmFxZnRjQXN5TzQ4ZzRQeDB6NnBtNUVIYktiWmRiWnhXTVMzV21kcURhRGxqY2pGSGc2cDdoWk41aStucmpSYitrdGJXVWJia1dTYy9wWHAycUR6eXdwTGsvcUVsbDFqL1lreHN3MTR3SXluVmlGVVgvdWl1MDlhTGxxNFA2RlJFd1J3Tk44UmpicnFDL21Mc3d0K3FTUkNYMFNXOGdWY3BEaUpKNHd0SVB4NnoyYUVjT1dJYkYzRENXQUJ0M29ZOTIrUVdsZFdXV2cyNENlMW50SnpjYXIvMUtxSTg0OTM3TjcrNGx3U2J5a3VUME1FY01NL2RRUW51Q0JQS01kUnU5aGpJVkIrRG9HTDZyNkorUkpoeThpdGVFMTViN3JXZ0JTRlBTbTRTK3Z5UzJ6Z2NuaXFaNzQwbENDNjVpZ2lKb0VnZUlwd2dtMnpsUGZnMW5ZclZzYXNjT3psZnNSNUhBZDZaU0RmbktBREZabm1iS3hZWXRGTTNUL296SHVWRytNM3lsVmRWRGN4VmpZWk5QZ2N5Rkd2OFZHOVg1bm1OM25lMjVGTUwvVndyL0tTYTFPNXRTLyt4UW05OE01TjZ0MjByRlkrdW5xVW5pelVxNDY1V05ObFZmRHNNdzRNZHZuN3VKcGtOL3l1c1RZdWNuc1ZPR2JnQjZ6RGlTOUQ3MWZmVTVMUUl4elNXUVk2ZlVWRWFWNElLTGhFVjJRL0tQT0Y3YkZzNkpzUm0zcGE2OExNQ09hVHRtS1BLNjhSY3dFYkhldHREV2ZtNDZQNUhwb3pPQnBabll6TldGSExEV05UcGQwQjhNSDlvVExRR1M3eFdOQlUwNURDYms0V2NNeWRSL1JvVUJ1TGxHbFhXSk9pSWMrekxuYXRTcnZ4cmxFTzIveGpEMHVUNjNlcTN5c1VCdlNseVFscGtHZ3ZZZFB3RGw0eWhNekdsWWpZSnprSU9PbFVCODB6Z2M1aEVOMHRpaUVwc0JmM21Ec2tuekgzQ056elJVeDdSNk9uaU5FNTNMQU9ZUitMQ2svT3ZpVUlqSjNoKzhGTFpDSW5iT0h0M3lkamxoZnpTR2lqUWFwZW84c1hib0lRYnFrVGtPYjdIQXgwbTdLUHlxaWFpcWNTWHpIQnRsL01GMXgwS003enZDZkdSMU1DWEh6WEN4bGxWUDdtQkFwYUU0RW9Eck5pRisrMjJiRFo5VENaQUR3dDBXNUZrYmZjbHJiQ0tYQWFmY1ZpT1FYZU9jOGtZQnBEVWZZa0dOTnNkR1pUZ3NMbGR6djFpTjU5ZmhGSlZuakZ4cHVxV1NSOGdjVyt5WDlhYW43V1ozSVRpelVsL0YwOTBnM1FPd0lOSmlOSDUyQ2FTSlVXS0gwZkJ2NVIyRXdNWW9KclVBRUgyT00zR1pHZTBmcnRFV1VXUUpDUlZFVGo4a1hpcWIzaEhlNXdCNDk1T3ZXNERwYmE5bEFXK1J4UWZBbzVxUjRxa0QyZnNHOWRtRmRpdXBmMSs2Ty9zOG1paFRIMkFGS1l0Z085UWUwL2tqSDRYN2pwNTgvak9xUHZ1QThlajRSekl1MDFXSUhOL3p1VmZtdDByVS92amRGRk5uNERhRFlHL0pkZkQ4bXJlaUhIcVphQ21PdVRGMVBVQnVpTTBoZnd4RkhKRGc3d1VWWXdxOGwwRmw3Wm44SGFnNzV4UVNyYk5NWW9LVmdLQTBXVzZHbXNHQUZWdVdqYk94bUxya09pN3E0aEd6dFMvNjlpdlBFb2pJcHBCdy94aUFUYUJocStFakZUd25QcGtUeU1ITkkwQTg5elZlL1MrUGF3QVFnZ2JIZ1VoaXVicUtNakIyT1hPSVFUTEprRmZBaVBFTFlhR2JiNjhrRnA4aGxxczdqaWdRNlBsYXRCT1dKTVNhQ2ROS3NIaVJNSnJTdEw5YURUL1EraVA1dWJiUXArVXNTWTRjeXdYMGxNZVhTYnkxTk0zTFdLSHU5RGJIZmVTeUhiMnVtdGhjanQ0WXpLclE2MkM1OElpbHFxTlBqVVVjbS9aQ1FrSWNEZGcrYUY4aWh3b05tWkhsOUFIR3REYXNmM3JTdGNYc1hPZzNWUGEvMmNwT3NnV0NGTzFZUTJqVXEvQWlyZzZUbytvQkhBbU1kRkxvZXVhakJoVGJNVXJVN3g4VmxTYVExN0FpaGRtSVBrT1hpa0Y1a2JCZDZRUVZnRkJQMGdXUVFpWlpkVS9qVjUvZzZUVjFNQk91WkRmczJVWTNnc1p2a2hOYm9FZ0NkdzlNMnFrWTc0WG5LYzEweks2VmQ3WTNldmRjd2hyc1pYMmRBR0lmcHNsRXNzNXN0TTBYRUN6YTVtalg1Vit4eG9OY3hkZExscmRYcXE5VFh4UWdXR2YyVTNpNDQrT0RMQUxWZDd2MEdOamxXckF0TlNjT3oxUmZyZVo4L2l0QTNyaXdGSmx6eVIzWUl3dHVGYWlZdFEySU5BQ29nN1NaTkcrZUJvWHFsdFU2UGRvcU5QQ0dwL1lUK29zdE0rOHJ1VmsvRUpXeE9DbHJ4UGhFL2tyV01UTkN2RUxyRHlFb0xkU0F3bU5VPSJ9',
                            );

                            if (success) {
                                navigate('/connection');
                            } else {
                                alert('Erro ao conectar');
                            }
                        }}
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
