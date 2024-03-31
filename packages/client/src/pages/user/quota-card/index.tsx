/* eslint-disable react/prop-types */
import {
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Heading,
    Icon,
    InputGroup,
    InputRightElement,
    Link,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    SimpleGrid,
    Spinner,
    Text,
    Tooltip,
    VStack,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useUser } from '../../../hooks/use-user';
import { useUserOperations } from '../../../hooks/use-user-operations';
import {
    bytesToHumanReadable,
    getErrorMessage,
    pluralize,
    translateNetworkPerformance,
} from '../../../services/helpers';
import { UserPageQuotaCardInstanceTypeCard } from './instance-type-card';
import { ConfirmDeletionAlertDialog } from '../../../components/confirm-deletion-alert-dialog';
import {
    GroupBase,
    OptionBase,
    Select as ChakraReactSelect,
    SelectComponentsConfig,
    chakraComponents,
} from 'chakra-react-select';
import { InstanceType } from '../../../services/api-protocols';
import { IconType } from 'react-icons';
import { FiCpu } from 'react-icons/fi';
import { FaNetworkWired } from 'react-icons/fa';
import { LiaMemorySolid } from 'react-icons/lia';
import { BsGpuCard } from 'react-icons/bs';
import { GiNightSleep } from 'react-icons/gi';
import { useInstanceTypes } from '../../../hooks/use-instance-types';

interface UserPageQuotaCardProps {
    userQuery: ReturnType<typeof useUser>['userQuery'];
}

interface InstanceTypeOption extends OptionBase {
    label: string;
    value: string;
    instanceType: InstanceType;
}

const instanceTypeSelectComponents: SelectComponentsConfig<
    InstanceTypeOption,
    false,
    GroupBase<InstanceTypeOption>
> = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Option: ({ children, ...props }) => {
        const gridItems: { icon: IconType; label: string; value: string }[] = [
            {
                icon: FiCpu,
                label: 'CPU',
                value: `${pluralize(props.data.instanceType.cpu.cores, 'Core', 'Cores')}, ${pluralize(props.data.instanceType.cpu.vCpus, 'vCPU', 'vCPUs')}, @ ${props.data.instanceType.cpu.clockSpeedInGhz} GHz (${props.data.instanceType.cpu.manufacturer})`,
            },
            {
                icon: FaNetworkWired,
                label: 'Performance de rede',
                value: translateNetworkPerformance(props.data.instanceType.networkPerformance),
            },
            {
                icon: LiaMemorySolid,
                label: 'Memória RAM',
                value: bytesToHumanReadable(props.data.instanceType.ram.sizeInMb, 'MB'),
            },
            {
                icon: BsGpuCard,
                label: 'Memória de vídeo',
                value:
                    props.data.instanceType.gpu.totalGpuMemoryInMb !== 0
                        ? `${bytesToHumanReadable(props.data.instanceType.gpu.totalGpuMemoryInMb, 'MB')} (${
                              props.data.instanceType.gpu.devices.length > 0
                                  ? props.data.instanceType.gpu.devices
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
                value: `Hibernação ${
                    props.data.instanceType.hibernationSupport ? ' ' : 'não '
                }suportada`,
            },
        ];

        return (
            <chakraComponents.Option {...props}>
                <VStack align={'start'}>
                    <Heading
                        size={'md'}
                        noOfLines={1}
                        mb={2}
                    >
                        {props.data.instanceType.name}
                    </Heading>
                    {gridItems.map(({ icon, label, value }, index) => (
                        <Tooltip
                            label={`${label}: ${value}`}
                            key={`instance-grid-item-${index}`}
                        >
                            <HStack
                                spacing={4}
                                align='center'
                            >
                                <Icon
                                    aria-label={value}
                                    as={icon}
                                    boxSize={'20px'}
                                />
                                <Text fontSize={'md'}>{value}</Text>
                            </HStack>
                        </Tooltip>
                    ))}
                </VStack>
            </chakraComponents.Option>
        );
    },
};

export const UserPageQuotaCard: React.FC<UserPageQuotaCardProps> = ({ userQuery }) => {
    const { updateQuotas } = useUserOperations();
    const toast = useToast();
    const [maxInstances, setMaxInstances] = React.useState<number>(
        userQuery.data?.quotas.maxInstances ?? 0,
    );
    const [debouncedMaxInstances, setDebouncedMaxInstances] = React.useState<number>();

    const [instanceTypeToRemove, setInstanceTypeToRemove] = React.useState<string | undefined>();
    const removeInstanceTypeModalDisclosure = useDisclosure();

    const { instanceTypesQuery } = useInstanceTypes();
    const numberOfAllowedInstanceTypes = userQuery.data?.quotas.allowedInstanceTypes.length ?? 0;

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedMaxInstances(maxInstances);
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, [maxInstances]);

    React.useEffect(() => {
        if (
            userQuery.data !== undefined &&
            debouncedMaxInstances !== undefined &&
            debouncedMaxInstances !== userQuery.data?.quotas.maxInstances &&
            debouncedMaxInstances >= 0
        ) {
            updateQuotas.mutate(
                {
                    userId: userQuery.data.id,
                    maxInstances: debouncedMaxInstances,
                },
                {
                    onError: (error) => {
                        toast({
                            title: 'Erro ao atualizar número de instâncias simultâneas',
                            description: getErrorMessage(error),
                            status: 'error',
                        });
                    },
                },
            );
        }
    }, [debouncedMaxInstances]);

    React.useEffect(() => {
        setMaxInstances(userQuery.data?.quotas.maxInstances ?? 0);
    }, [userQuery.data?.quotas.maxInstances]);

    return (
        <VStack
            spacing={4}
            align={'start'}
        >
            <ConfirmDeletionAlertDialog
                isLoading={updateQuotas.isPending}
                isOpen={removeInstanceTypeModalDisclosure.isOpen}
                onClose={removeInstanceTypeModalDisclosure.onClose}
                title={`Remover tipo de instância ${instanceTypeToRemove ?? ''}?`}
                text={`O usuário não poderá mais criar instâncias desse tipo.`}
                onConfirm={() => {
                    if (userQuery.data === undefined) {
                        return;
                    }

                    updateQuotas.mutate(
                        {
                            userId: userQuery.data.id,
                            allowedInstanceTypes: [
                                ...new Set(
                                    userQuery.data.quotas.allowedInstanceTypes
                                        .filter(
                                            (instanceType) =>
                                                instanceType.name !== instanceTypeToRemove,
                                        )
                                        .map((instanceType) => instanceType.name),
                                ),
                            ],
                        },
                        {
                            onSuccess() {
                                removeInstanceTypeModalDisclosure.onClose();
                            },
                            onError() {
                                removeInstanceTypeModalDisclosure.onClose();
                            },
                        },
                    );
                }}
            />

            <Heading
                size={'lg'}
                color='gray.800'
            >
                Cotas de uso
            </Heading>

            <Box
                w={'full'}
                bgColor={'white'}
                px={4}
                py={8}
                borderRadius={12}
                boxShadow={'md'}
            >
                <FormControl>
                    <FormLabel fontWeight={'bold'}>Número de instâncias simultâneas</FormLabel>
                    <InputGroup>
                        <NumberInput
                            width={'100%'}
                            value={maxInstances}
                            min={0}
                            onChange={(valueString) => {
                                const value = parseInt(valueString);

                                if (Number.isNaN(value)) {
                                    setMaxInstances(0);
                                    return;
                                }

                                setMaxInstances(value);
                            }}
                        >
                            <NumberInputField />
                            <NumberInputStepper
                                hidden={userQuery.isLoading || updateQuotas.isPending}
                            >
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>

                        {(userQuery.isLoading || updateQuotas.isPending) && (
                            <InputRightElement>
                                <Spinner size='sm' />
                            </InputRightElement>
                        )}
                    </InputGroup>
                    <FormHelperText>
                        O número máximo de instâncias que o usuário pode ter simultaneamente.
                    </FormHelperText>
                </FormControl>

                <FormControl
                    mt={'2%'}
                    isReadOnly
                >
                    <FormLabel fontWeight={'bold'}>Pode criar instâncias com hibernação?</FormLabel>
                    <InputGroup>
                        <Select
                            isDisabled={userQuery.isLoading || updateQuotas.isPending}
                            value={
                                userQuery.data?.quotas.canLaunchInstanceWithHibernation !==
                                undefined
                                    ? userQuery.data?.quotas.canLaunchInstanceWithHibernation
                                        ? 'true'
                                        : 'false'
                                    : '-'
                            }
                            onChange={(e) => {
                                updateQuotas.mutate({
                                    userId: userQuery.data?.id ?? '',
                                    canLaunchInstanceWithHibernation: e.target.value === 'true',
                                });
                            }}
                        >
                            <option value='true'>Sim</option>
                            <option value='false'>Não</option>
                        </Select>
                        {(userQuery.isLoading || updateQuotas.isPending) && (
                            <InputRightElement>
                                <Spinner
                                    size='sm'
                                    hidden={!userQuery.isLoading}
                                />
                            </InputRightElement>
                        )}
                    </InputGroup>
                    <FormHelperText>
                        A hibernação possibilita desligar a instância mantendo o estado de execução.
                        Ao ligar a instância, a execução continua de onde parou.
                    </FormHelperText>
                </FormControl>

                <FormControl mt={'2%'}>
                    <FormLabel fontWeight={'bold'}>Tipos de instâncias permitidos</FormLabel>

                    <ChakraReactSelect
                        name='instanceType'
                        placeholder='Selecione um tipo de instância'
                        noOptionsMessage={() => 'Nenhum tipo de instância encontrado'}
                        selectedOptionColorScheme='blue'
                        isLoading={instanceTypesQuery.isLoading || updateQuotas.isPending}
                        components={instanceTypeSelectComponents}
                        options={(() => {
                            return instanceTypesQuery.data?.map((instanceType) => ({
                                label: instanceType.name,
                                value: instanceType.name,
                                instanceType,
                            }));
                        })()}
                        onChange={(selected) => {
                            if (selected === null) {
                                return;
                            }

                            if (userQuery.data === undefined) {
                                return;
                            }

                            if (
                                userQuery.data.quotas.allowedInstanceTypes.find(
                                    (instanceType) => instanceType.name === selected.value,
                                ) !== undefined
                            ) {
                                toast({
                                    title: 'Tipo de instância já permitido',
                                    description:
                                        'O tipo de instância selecionado já está permitido',
                                    status: 'info',
                                });
                                return;
                            }

                            updateQuotas.mutate(
                                {
                                    userId: userQuery.data.id,
                                    allowedInstanceTypes: [
                                        ...new Set([
                                            ...userQuery.data.quotas.allowedInstanceTypes.map(
                                                (instanceType) => instanceType.name,
                                            ),
                                            selected.value,
                                        ]),
                                    ],
                                },
                                {
                                    onError: (error) => {
                                        toast({
                                            title: 'Erro ao adicionar tipo de instância',
                                            description: getErrorMessage(error),
                                            status: 'error',
                                        });
                                    },
                                },
                            );
                        }}
                    />

                    {!userQuery.isLoading && numberOfAllowedInstanceTypes > 0 && (
                        <InputGroup>
                            <SimpleGrid
                                columns={{ base: 1, md: 2 }}
                                spacing={4}
                                w={'full'}
                                my={4}
                                hidden={userQuery.isLoading}
                            >
                                {userQuery.data?.quotas.allowedInstanceTypes.map(
                                    (instanceType, index) => (
                                        <UserPageQuotaCardInstanceTypeCard
                                            key={`user-page-quota-card-instance-type-card-${instanceType.name}-${index}`}
                                            onRemove={() => {
                                                setInstanceTypeToRemove(instanceType.name);
                                                removeInstanceTypeModalDisclosure.onOpen();
                                            }}
                                            instanceType={instanceType}
                                        />
                                    ),
                                )}
                            </SimpleGrid>
                        </InputGroup>
                    )}

                    {!userQuery.isLoading && numberOfAllowedInstanceTypes === 0 && (
                        <Box
                            py={4}
                            w={'100%'}
                            textAlign={'left'}
                        >
                            <Text color={'gray.500'}>Nenhum tipo de instância permitido</Text>
                        </Box>
                    )}

                    {userQuery.isLoading && (
                        <Box
                            py={4}
                            w={'full'}
                            textAlign={'left'}
                        >
                            <Spinner size='md' />
                        </Box>
                    )}

                    <FormHelperText>
                        Os tipos de instâncias que o usuário pode criar. Para mais informações,{' '}
                        <Link
                            isExternal
                            href={
                                'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html'
                            }
                            color={'blue.500'}
                        >
                            clique aqui
                        </Link>
                        .
                    </FormHelperText>
                </FormControl>
            </Box>
        </VStack>
    );
};
