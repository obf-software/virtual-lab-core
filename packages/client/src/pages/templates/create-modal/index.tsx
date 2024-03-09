import {
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { InstanceTemplate } from '../../../services/api-protocols';
import { BiRocket } from 'react-icons/bi';
import { useInstanceTemplateOperations } from '../../../hooks/use-instance-template-operations';

export interface TemplatesPageCreateModalProps {
    copyFrom?: InstanceTemplate;
    isOpen: boolean;
    onClose: () => void;
}

interface TemplatesPageCreateModalForm {
    name: string;
    description: string;
    machineImageId: string;
    storageInGb?: string;
}

export const TemplatesPageCreateModal: React.FC<TemplatesPageCreateModalProps> = ({
    copyFrom,
    isOpen,
    onClose,
}) => {
    const { createInstanceTemplate } = useInstanceTemplateOperations();
    const toast = useToast();

    const formMethods = useForm<TemplatesPageCreateModalForm>();

    React.useEffect(() => {
        if (copyFrom === undefined) {
            formMethods.reset({});
            return;
        }

        formMethods.reset({
            name: `Copia de ${copyFrom.name}`,
            description: `Cópia de ${copyFrom.description}`,
            machineImageId: copyFrom.machineImageId,
            storageInGb: copyFrom.storageInGb.toString(),
        });

        return () => {
            formMethods.reset({});
        };
    }, [copyFrom]);

    const submitHandler: SubmitHandler<TemplatesPageCreateModalForm> = ({
        name,
        description,
        machineImageId,
        storageInGb,
    }) => {
        createInstanceTemplate.mutate(
            {
                name,
                description,
                machineImageId,
                storageInGb: storageInGb ? parseInt(storageInGb) : undefined,
            },
            {
                onSuccess: () => {
                    formMethods.reset();
                    onClose();
                },
                onError: (error) => {
                    toast({
                        title: 'Erro ao criar instância',
                        description: error.message,
                        status: 'error',
                        isClosable: true,
                    });
                },
            },
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                formMethods.reset();
                onClose();
            }}
            motionPreset='scale'
            isCentered
            closeOnOverlayClick={!createInstanceTemplate.isPending}
            closeOnEsc={!createInstanceTemplate.isPending}
            scrollBehavior='outside'
        >
            <ModalOverlay />

            <ModalContent py={4}>
                <ModalHeader>
                    <Heading
                        size={'lg'}
                        noOfLines={2}
                    >
                        Criar Template
                    </Heading>
                </ModalHeader>

                <ModalCloseButton isDisabled={createInstanceTemplate.isPending} />

                <FormProvider {...formMethods}>
                    <ModalBody>
                        <FormControl
                            isRequired
                            isInvalid={formMethods.formState.errors.name !== undefined}
                        >
                            <FormLabel
                                id='name'
                                fontWeight={'semibold'}
                            >
                                Nome do template
                            </FormLabel>

                            <Input
                                id='name'
                                {...formMethods.register('name', {
                                    minLength: {
                                        value: 3,
                                        message:
                                            'O nome do template deve ter no mínimo 3 caracteres',
                                    },
                                    required: {
                                        value: true,
                                        message: 'O nome do template é obrigatório',
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
                                            'A descrição do template deve ter no mínimo 3 caracteres',
                                    },
                                    required: {
                                        value: true,
                                        message: 'A descrição do template é obrigatória',
                                    },
                                })}
                            />

                            <FormErrorMessage>
                                {formMethods.formState.errors.description?.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl
                            isRequired
                            isInvalid={formMethods.formState.errors.machineImageId !== undefined}
                            mt={'5%'}
                        >
                            <FormLabel
                                id='machineImageId'
                                fontWeight={'semibold'}
                            >
                                ID da Imagem da máquina
                            </FormLabel>

                            <Input
                                id='machineImageId'
                                {...formMethods.register('machineImageId', {
                                    required: {
                                        value: true,
                                        message: 'A imagem da máquina é obrigatória',
                                    },
                                })}
                            />
                            {formMethods.formState.errors.machineImageId?.message !== undefined ? (
                                <FormErrorMessage>
                                    {formMethods.formState.errors.machineImageId?.message}
                                </FormErrorMessage>
                            ) : (
                                <FormHelperText>
                                    <Text>
                                        Para consultar as AMIs disponíveis na AWS,{' '}
                                        <Link
                                            href={
                                                'https://console.aws.amazon.com/ec2/v2/home#Images:sort=name'
                                            }
                                            isExternal
                                            color={'blue.500'}
                                        >
                                            clique aqui
                                        </Link>
                                    </Text>
                                </FormHelperText>
                            )}
                        </FormControl>

                        <FormControl
                            isInvalid={formMethods.formState.errors.storageInGb !== undefined}
                            mt={'5%'}
                        >
                            <FormLabel
                                id='storageInGb'
                                fontWeight={'semibold'}
                            >
                                Armazenamento (em GB)
                            </FormLabel>

                            <InputGroup>
                                <Input
                                    id='storageInGb'
                                    type={'number'}
                                    {...formMethods.register('storageInGb', {
                                        min: {
                                            value: 8,
                                            message: 'O armazenamento deve ser de no mínimo 8GB',
                                        },
                                    })}
                                />
                                <InputRightElement pointerEvents='none'>
                                    <Text textColor={'gray'}>GB</Text>
                                </InputRightElement>
                            </InputGroup>

                            {formMethods.formState.errors.storageInGb?.message !== undefined ? (
                                <FormErrorMessage>
                                    {formMethods.formState.errors.storageInGb?.message}
                                </FormErrorMessage>
                            ) : (
                                <FormHelperText>
                                    Opcional. Caso não informado, será utilizado o armazenamento da
                                    imagem da máquina
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
                            isLoading={createInstanceTemplate.isPending}
                        >
                            Criar template
                        </Button>
                    </ModalFooter>
                </FormProvider>
            </ModalContent>
        </Modal>
    );
};
