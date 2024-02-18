import {
    Button,
    Divider,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Switch,
    Text,
    Textarea,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { InstanceTemplate } from '../../services/api-protocols';
import { BiRocket } from 'react-icons/bi';
import { useUser } from '../../hooks/use-user';
import { useInstanceOperations } from '../../hooks/use-instance-operations';

export interface LaunchInstanceModalProps {
    instanceTemplate: InstanceTemplate;
    isOpen: boolean;
    onClose: () => void;
}

interface LaunchInstanceForm {
    name: string;
    description: string;
    enableHibernation: boolean;
    instanceType: string;
}

export const LaunchInstanceModal: React.FC<LaunchInstanceModalProps> = ({
    instanceTemplate,
    isOpen,
    onClose,
}) => {
    const { userQuery } = useUser({ userId: 'me' });
    const { launchInstance } = useInstanceOperations();
    const toast = useToast();

    const formMethods = useForm<LaunchInstanceForm>({
        defaultValues: {
            name: instanceTemplate.name,
            description: instanceTemplate.description,
            enableHibernation: false,
        },
    });

    const submitHandler: SubmitHandler<LaunchInstanceForm> = ({
        enableHibernation,
        description,
        name,
        instanceType,
    }) => {
        launchInstance.mutate(
            {
                ownerId: 'me',
                templateId: instanceTemplate.id,
                name,
                description,
                enableHibernation,
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
                    <Heading size={'lg'}>{instanceTemplate.name}</Heading>
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
                            color={'gray.600'}
                            fontWeight={'bold'}
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
                                fontWeight={'bold'}
                            >
                                {instanceTemplate.description}
                            </Text>

                            <Divider mb={'5%'} />

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.name !== undefined}
                            >
                                <FormLabel id='name'>Nome</FormLabel>

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
                                {formMethods.formState.errors.name !== undefined ? (
                                    <FormErrorMessage>
                                        {formMethods.formState.errors.name?.message}
                                    </FormErrorMessage>
                                ) : (
                                    <FormHelperText>Nome da instância</FormHelperText>
                                )}
                            </FormControl>

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.description !== undefined}
                                mt={'5%'}
                            >
                                <FormLabel id='description'>Descrição</FormLabel>

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

                                {formMethods.formState.errors.description !== undefined ? (
                                    <FormErrorMessage>
                                        {formMethods.formState.errors.description.message}
                                    </FormErrorMessage>
                                ) : (
                                    <FormHelperText>Descrição da instância</FormHelperText>
                                )}
                            </FormControl>

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.instanceType !== undefined}
                                mt={'5%'}
                            >
                                <FormLabel id='instanceType'>Tipo de instância</FormLabel>

                                <Select
                                    id='instanceType'
                                    {...formMethods.register('instanceType', {
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
                                                    !userQuery.data?.quotas.allowedInstanceTypes.includes(
                                                        value,
                                                    )
                                                ) {
                                                    return 'Tipo de instância não permitido para este usuário';
                                                }
                                            },
                                        },
                                    })}
                                >
                                    {userQuery.data?.quotas.allowedInstanceTypes.map(
                                        (allowedInstanceType, i) => (
                                            <option
                                                key={`allowed-instance-type-${i}`}
                                                value={allowedInstanceType}
                                            >
                                                {allowedInstanceType}
                                            </option>
                                        ),
                                    )}
                                </Select>

                                {formMethods.formState.errors.instanceType !== undefined ? (
                                    <FormErrorMessage>
                                        {formMethods.formState.errors.instanceType.message}
                                    </FormErrorMessage>
                                ) : (
                                    <FormHelperText>Selecione o tipo de instância</FormHelperText>
                                )}
                            </FormControl>

                            <FormControl
                                isRequired
                                isInvalid={
                                    formMethods.formState.errors.enableHibernation !== undefined
                                }
                                mt={'5%'}
                            >
                                <FormLabel id='enableHibernation'>Hibernação</FormLabel>

                                <Switch
                                    id='enableHibernation'
                                    {...formMethods.register('enableHibernation', {
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

                                {formMethods.formState.errors.enableHibernation !== undefined ? (
                                    <FormErrorMessage>
                                        {formMethods.formState.errors.enableHibernation.message}
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
