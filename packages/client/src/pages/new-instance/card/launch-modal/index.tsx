/* eslint-disable react/prop-types */
import {
    Button,
    Divider,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    HStack,
    Heading,
    Icon,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Switch,
    Text,
    Textarea,
    Tooltip,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { BiRocket } from 'react-icons/bi';
import { useUser } from '../../../../hooks/use-user';
import { useInstanceOperations } from '../../../../hooks/use-instance-operations';
import { InstanceTemplate, InstanceType } from '../../../../services/api-protocols';
import {
    GroupBase,
    OptionBase,
    Select,
    SelectComponentsConfig,
    SingleValue,
    chakraComponents,
} from 'chakra-react-select';
import { FiCpu } from 'react-icons/fi';
import {
    bytesToHumanReadable,
    pluralize,
    translateNetworkPerformance,
} from '../../../../services/helpers';
import { FaNetworkWired } from 'react-icons/fa';
import { LiaMemorySolid } from 'react-icons/lia';
import { BsGpuCard } from 'react-icons/bs';
import { IconType } from 'react-icons';
import { GiNightSleep } from 'react-icons/gi';

export interface NewInstancePageCardLaunchModalProps {
    instanceTemplate: InstanceTemplate;
    isOpen: boolean;
    onClose: () => void;
}

interface LaunchForm {
    name: string;
    description: string;
    canHibernate: boolean;
    instanceType: string;
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
                value: `${pluralize(props.data.instanceType.cpu.cores, 'Core', 'Cores')}, ${pluralize(props.data.instanceType.cpu.vCpus, 'vCPU', 'vCPUs')}, ${pluralize(props.data.instanceType.cpu.threadsPerCore, 'Thread por Core', 'Threads por Core')}, @ ${props.data.instanceType.cpu.clockSpeedInGhz} GHz (${props.data.instanceType.cpu.manufacturer})`,
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

export const NewInstancePageCardLaunchModal: React.FC<NewInstancePageCardLaunchModalProps> = ({
    instanceTemplate,
    isOpen,
    onClose,
}) => {
    const { userQuery } = useUser({ userId: 'me' });
    const { launchInstance } = useInstanceOperations();
    const toast = useToast();

    const formMethods = useForm<LaunchForm>({
        defaultValues: {
            name: instanceTemplate.name,
            description: instanceTemplate.description,
            canHibernate: false,
        },
    });

    const instanceTypeWatch = formMethods.watch('instanceType');

    React.useEffect(() => {
        if (instanceTypeWatch) {
            const instanceType = userQuery.data?.quotas.allowedInstanceTypes.find(
                (it) => it.name === instanceTypeWatch,
            );

            if (!instanceType) {
                formMethods.setError('instanceType', {
                    type: 'notAllowed',
                    message: 'Você não tem permissão para criar este tipo de instância',
                });
            } else {
                formMethods.clearErrors('instanceType');
            }
        }
    }, [instanceTypeWatch]);

    const submitHandler: SubmitHandler<LaunchForm> = ({
        canHibernate,
        description,
        name,
        instanceType,
    }) => {
        if (!instanceType || instanceType === '') {
            formMethods.setError('instanceType', {
                type: 'required',
                message: 'O tipo de instância é obrigatório',
            });
            return;
        }

        const instanceTypeHasHibernationSupport =
            userQuery.data?.quotas.allowedInstanceTypes.find((it) => it.name === instanceType)
                ?.hibernationSupport ?? false;

        if (canHibernate && !instanceTypeHasHibernationSupport) {
            formMethods.setError('canHibernate', {
                type: 'notAllowed',
                message: 'Hibernação não permitida para este tipo de instância',
            });
            return;
        }

        launchInstance.mutate(
            {
                ownerId: 'me',
                templateId: instanceTemplate.id,
                name,
                description,
                canHibernate,
                instanceType,
            },
            {
                onError: (error) => {
                    toast({
                        title: 'Erro ao criar instância',
                        description: error.message,
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                        position: 'bottom-right',
                    });
                },
            },
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            motionPreset='scale'
            isCentered
            closeOnOverlayClick={!launchInstance.isPending}
            closeOnEsc={!launchInstance.isPending}
            scrollBehavior='outside'
        >
            <ModalOverlay />

            <ModalContent py={4}>
                <ModalHeader>
                    <Heading
                        size={'lg'}
                        noOfLines={2}
                    >
                        {instanceTemplate.name}
                    </Heading>
                </ModalHeader>

                <ModalCloseButton isDisabled={launchInstance.isPending} />

                {userQuery.isLoading && (
                    <ModalBody
                        justifyContent={'center'}
                        alignItems={'center'}
                        display={'flex'}
                        py={10}
                    >
                        <Spinner
                            size={'xl'}
                            speed={'1s'}
                            thickness={'4px'}
                            color={'blue.500'}
                            emptyColor={'gray.200'}
                        />
                    </ModalBody>
                )}

                {!userQuery.isLoading && userQuery.isError && (
                    <ModalBody>
                        <Text
                            size={'lg'}
                            color={'gray.600'}
                            noOfLines={3}
                            textAlign={'center'}
                        >
                            Não foi possível verificar as permissões do usuário
                        </Text>
                    </ModalBody>
                )}

                {!userQuery.isLoading && userQuery.data && (
                    <FormProvider {...formMethods}>
                        <ModalBody>
                            <Text
                                mb={'5%'}
                                color={'gray.600'}
                            >
                                {instanceTemplate.description}
                            </Text>

                            <Divider mb={'5%'} />

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.name !== undefined}
                            >
                                <FormLabel
                                    id='name'
                                    fontWeight={'semibold'}
                                >
                                    Nome da instância
                                </FormLabel>

                                <Input
                                    id='name'
                                    {...formMethods.register('name', {
                                        minLength: {
                                            value: 3,
                                            message:
                                                'O nome da instância deve ter no mínimo 3 caracteres',
                                        },
                                        required: {
                                            value: true,
                                            message: 'O nome da instância é obrigatório',
                                        },
                                    })}
                                />
                                <FormErrorMessage>
                                    {formMethods.formState.errors.name?.message}
                                </FormErrorMessage>
                            </FormControl>

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.description !== undefined}
                                mt={'5%'}
                            >
                                <FormLabel
                                    id='description'
                                    fontWeight={'semibold'}
                                >
                                    Descrição
                                </FormLabel>

                                <Textarea
                                    id='description'
                                    noOfLines={3}
                                    {...formMethods.register('description', {
                                        minLength: {
                                            value: 3,
                                            message:
                                                'A descrição da instância deve ter no mínimo 3 caracteres',
                                        },
                                        required: {
                                            value: true,
                                            message: 'A descrição da instância é obrigatória',
                                        },
                                    })}
                                />

                                <FormErrorMessage>
                                    {formMethods.formState.errors.description?.message}
                                </FormErrorMessage>
                            </FormControl>

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.instanceType !== undefined}
                                mt={'5%'}
                            >
                                <FormLabel
                                    id='instanceType'
                                    fontWeight={'semibold'}
                                >
                                    Tipo de instância
                                </FormLabel>

                                {/* {...formMethods.register('instanceType', {
                                        validate: {
                                            noAllowedInstanceTypes: () => {
                                                if (
                                                    userQuery.data.quotas.allowedInstanceTypes
                                                        .length === 0
                                                ) {
                                                    return 'Não há tipos de instâncias permitidos para este usuário';
                                                }
                                            },
                                            invalidUser: () => {
                                                if (!userQuery.data || userQuery.isError) {
                                                    return 'Não foi possível verificar as permissões do usuário';
                                                }
                                            },
                                            notAllowed: (value) => {
                                                if (
                                                    !userQuery.data?.quotas.allowedInstanceTypes
                                                        .map((it) => it.name)
                                                        .includes(value)
                                                ) {
                                                    return 'Você não tem permissão para criar este tipo de instância';
                                                }
                                            },
                                        },
                                    })} */}

                                <Select
                                    name='instanceType'
                                    placeholder='Buscar'
                                    noOptionsMessage={() => 'Nenhum tipo de instância encontrado'}
                                    selectedOptionColorScheme='blue'
                                    isLoading={userQuery.isLoading}
                                    components={instanceTypeSelectComponents}
                                    value={
                                        {
                                            label: instanceTypeWatch,
                                            value: instanceTypeWatch,
                                            instanceType:
                                                userQuery.data?.quotas.allowedInstanceTypes.find(
                                                    (it) => it.name === instanceTypeWatch,
                                                ),
                                        } as InstanceTypeOption
                                    }
                                    options={userQuery.data?.quotas.allowedInstanceTypes.map(
                                        (instanceType) => ({
                                            label: instanceType.name,
                                            value: instanceType.name,
                                            instanceType,
                                        }),
                                    )}
                                    onChange={(selected) => {
                                        const s =
                                            selected as unknown as SingleValue<InstanceTypeOption>;
                                        formMethods.setValue('instanceType', s?.value ?? '');
                                    }}

                                    // options={searchGroupsQuery.data?.data?.map((group) => ({
                                    //     label: group.name,
                                    //     value: group,
                                    // }))}
                                    // onInputChange={(value) => {
                                    //     setTextQuery(value);
                                    // }}
                                    // onChange={(selec `ted) => {
                                    //     setGroupsToLink(selected.map((item) => item.value) ?? []);
                                    // }}
                                    // value={groupsToLink.map((group) => ({
                                    //     label: group.name,
                                    //     value: group,
                                    // }))}
                                />

                                <FormErrorMessage>
                                    {formMethods.formState.errors.instanceType?.message}
                                </FormErrorMessage>
                            </FormControl>

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.canHibernate !== undefined}
                                mt={'5%'}
                            >
                                <FormLabel
                                    id='canHibernate'
                                    fontWeight={'semibold'}
                                >
                                    Hibernação
                                </FormLabel>

                                <Switch
                                    id='canHibernate'
                                    {...formMethods.register('canHibernate', {
                                        validate: {
                                            invalidUser: () => {
                                                if (!userQuery.data || userQuery.isError) {
                                                    return 'Não foi possível verificar as permissões do usuário';
                                                }
                                            },
                                            notAllowed: (value) => {
                                                if (
                                                    value &&
                                                    !userQuery.data?.quotas
                                                        .canLaunchInstanceWithHibernation
                                                ) {
                                                    return 'Hibernação não permitida para este usuário';
                                                }
                                            },
                                        },
                                    })}
                                    colorScheme='blue'
                                />

                                {formMethods.formState.errors.canHibernate !== undefined ? (
                                    <FormErrorMessage>
                                        {formMethods.formState.errors.canHibernate.message}
                                    </FormErrorMessage>
                                ) : (
                                    <FormHelperText>
                                        A hibernação permite que a instância ao ser desligada
                                        mantenha seu estado de execução, permitindo que ao ser
                                        ligada novamente, continue de onde parou
                                    </FormHelperText>
                                )}
                            </FormControl>
                        </ModalBody>

                        <ModalFooter
                            justifyContent={'center'}
                            alignItems={'center'}
                        >
                            <Button
                                leftIcon={<BiRocket />}
                                colorScheme='blue'
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onClick={formMethods.handleSubmit(submitHandler)}
                                isLoading={launchInstance.isPending}
                            >
                                Criar instância
                            </Button>
                        </ModalFooter>
                    </FormProvider>
                )}
            </ModalContent>
        </Modal>
    );
};
