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
import { IconType } from 'react-icons';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import { BiBookBookmark, BiHdd, BiMicrochip } from 'react-icons/bi';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { InstancesPageCardDetailsModal } from './details-modal';
import { Instance } from '../../../services/api-protocols';
import { getInstancePlatformIcon } from '../../../services/helpers';
import { InstanceStateTag } from '../../../components/instance-state-tag';
import { useInstanceOperations } from '../../../hooks/use-instance-operations';
import { ConfirmDeletionAlertDialog } from '../../../components/confirm-deletion-alert-dialog';
import { useUser } from '../../../hooks/use-user';
import { useAuthSessionData } from '../../../hooks/use-auth-session-data';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('pt-br');

interface InstancesPageCardProps {
    instance: Instance;
    isDisabled: boolean;
}

export const InstancesPageCard: React.FC<InstancesPageCardProps> = ({ instance, isDisabled }) => {
    const authSessionData = useAuthSessionData();
    const detailsModalDisclosure = useDisclosure();
    const confirmDeletionDisclosure = useDisclosure();
    const { deleteInstance, rebootInstance, turnInstanceOn, turnInstanceOff } =
        useInstanceOperations();

    const isPending =
        deleteInstance.isPending ||
        rebootInstance.isPending ||
        turnInstanceOn.isPending ||
        turnInstanceOff.isPending;

    const gridItems: { icon: IconType; label: string; value: string }[] = [
        {
            icon: FiCpu,
            label: 'CPU',
            value: instance.cpuCores,
        },
        {
            icon: getInstancePlatformIcon(instance.platform),
            label: 'Sistema operacional',
            value: instance.distribution,
        },
        {
            icon: BiHdd,
            label: 'Armazenamento',
            value: `${instance.storageInGb} GB`,
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
            value: `${instance.memoryInGb} GB`,
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
            <ConfirmDeletionAlertDialog
                title={`Excluir instância "${instance.name}"`}
                text={`Você tem certeza que deseja excluir a instância? Esta ação não poderá ser desfeita.`}
                isLoading={deleteInstance.isPending}
                isOpen={confirmDeletionDisclosure.isOpen}
                onClose={confirmDeletionDisclosure.onClose}
                onConfirm={() => deleteInstance.mutate({ instanceId: instance.id })}
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
                    <InstanceStateTag
                        state={!instance.virtualId ? 'PROVISIONING' : instance.state}
                    />
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
                        hidden={instance.state !== 'RUNNING'}
                        isDisabled={isDisabled || isPending}
                        // onClick={onConnect}
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
                            isLoading={turnInstanceOff.isPending}
                            isDisabled={isDisabled || isPending}
                            onClick={() => turnInstanceOff.mutate({ instanceId: instance.id })}
                        />
                    ) : (
                        <Button
                            leftIcon={<FiPower />}
                            size={'lg'}
                            colorScheme='red'
                            hidden={instance.state !== 'RUNNING'}
                            isLoading={turnInstanceOff.isPending}
                            isDisabled={isDisabled || isPending}
                            onClick={() => turnInstanceOff.mutate({ instanceId: instance.id })}
                        >
                            Desligar
                        </Button>
                    )}

                    <Button
                        leftIcon={<FiPower />}
                        size={'lg'}
                        colorScheme='green'
                        hidden={instance.state !== 'STOPPED'}
                        isLoading={turnInstanceOn.isPending}
                        isDisabled={isDisabled || isPending}
                        onClick={() => turnInstanceOn.mutate({ instanceId: instance.id })}
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
                                        (instance.state !== 'STOPPED' || isDisabled || isPending) &&
                                        'A instância precisa estar desligada para criar um template'
                                    }
                                >
                                    <MenuItem
                                        icon={<BiBookBookmark />}
                                        isDisabled={
                                            instance.state !== 'STOPPED' || isDisabled || isPending
                                        }
                                        // onClick={confirmDeletionDisclosure.onOpen}
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
                                isDisabled={instance.state !== 'RUNNING' || isDisabled || isPending}
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
