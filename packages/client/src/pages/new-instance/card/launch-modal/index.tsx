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
import { BiRocket } from 'react-icons/bi';
import { useUser } from '../../../../hooks/use-user';
import { useInstanceOperations } from '../../../../hooks/use-instance-operations';
import { InstanceTemplate } from '../../../../services/api-protocols';

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

    const submitHandler: SubmitHandler<LaunchForm> = ({
        canHibernate,
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
