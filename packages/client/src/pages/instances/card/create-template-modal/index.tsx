import React from 'react';
import {
    Box,
    Button,
    ButtonGroup,
    Divider,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Instance } from '../../../../services/api-protocols';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { useInstanceOperations } from '../../../../hooks/use-instance-operations';
import { bytesToHumanReadable } from '../../../../services/helpers';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);

interface InstancesPageCardCreateTemplateModalProps {
    instance: Instance;
    isOpen: boolean;
    onClose: () => void;
}

interface CreateTemplateForm {
    name: string;
    description: string;
    storageInGb?: string;
}

export const InstancesPageCardCreateTemplateModal: React.FC<
    InstancesPageCardCreateTemplateModalProps
> = ({ instance, isOpen, onClose }) => {
    const formMethods = useForm<CreateTemplateForm>();
    const { createTemplate } = useInstanceOperations();
    const toast = useToast();

    const submitHandler: SubmitHandler<CreateTemplateForm> = (data) => {
        createTemplate.mutate(
            {
                instanceId: instance.id,
                name: data.name,
                description: data.description,
                storageInGb: data.storageInGb ? Number(data.storageInGb) : undefined,
            },
            {
                onSuccess: () => {
                    formMethods.reset({});
                    onClose();
                },
                onError: (error) => {
                    toast({
                        title: 'Erro ao criar template',
                        description: error.message,
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                },
            },
        );
    };

    React.useEffect(() => {
        formMethods.reset({
            name: `Template de ${instance.name}`,
            description: instance.description,
            storageInGb: instance.storageInGb?.toString(),
        });

        return () => {
            formMethods.reset({});
        };
    }, [instance, formMethods, isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            motionPreset='scale'
            isCentered
            closeOnOverlayClick={!createTemplate.isPending}
            closeOnEsc={!createTemplate.isPending}
        >
            <ModalOverlay />
            <ModalContent
                maxW={'xl'}
                py={4}
            >
                <ModalHeader>
                    <Text
                        fontSize='2xl'
                        fontWeight='bold'
                    >
                        Criar template a partir de instância
                    </Text>
                </ModalHeader>

                <ModalCloseButton isDisabled={createTemplate.isPending} />

                <FormProvider {...formMethods}>
                    <ModalBody>
                        <Box mb={5}>
                            <Text
                                fontSize='lg'
                                color={'gray.600'}
                            >
                                O template será criado a partir da imagem atual da instância. É
                                recomendado que a instância esteja desligada para garantir a
                                consistência dos dados.
                            </Text>

                            <Text
                                mt={2}
                                fontSize='lg'
                                color={'gray.600'}
                            >
                                A duração do processo pode variar de acordo com o tamanho do
                                armazenamento da instância.
                            </Text>

                            <Divider my={5} />
                        </Box>

                        <FormControl
                            isRequired
                            isInvalid={formMethods.formState.errors.name !== undefined}
                            mt={5}
                        >
                            <FormLabel fontWeight={'bold'}>Nome do template</FormLabel>
                            <Input
                                isDisabled={createTemplate.isPending}
                                {...formMethods.register('name', {
                                    required: 'Nome é obrigatório',
                                })}
                            />

                            <FormErrorMessage>
                                {formMethods.formState.errors.name?.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl
                            isRequired
                            isInvalid={formMethods.formState.errors.name !== undefined}
                            mt={5}
                        >
                            <FormLabel fontWeight={'bold'}>Descrição</FormLabel>
                            <Textarea
                                isDisabled={createTemplate.isPending}
                                noOfLines={3}
                                {...formMethods.register('description', {
                                    required: 'Descrição é obrigatória',
                                })}
                            />

                            <FormErrorMessage>
                                {formMethods.formState.errors.name?.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl
                            mt={5}
                            isInvalid={formMethods.formState.errors.storageInGb !== undefined}
                        >
                            <FormLabel fontWeight={'bold'}>Armazenamento (em GB)</FormLabel>

                            <InputGroup>
                                <Input
                                    isDisabled={createTemplate.isPending}
                                    type={'number'}
                                    {...formMethods.register('storageInGb', {
                                        min: {
                                            value: Number(instance.storageInGb),
                                            message: `O armazenamento deve ser maior ou igual a ${bytesToHumanReadable(parseInt(instance.storageInGb), 'GB')}`,
                                        },
                                    })}
                                />
                                <InputRightElement pointerEvents='none'>
                                    <Text textColor={'gray'}>GB</Text>
                                </InputRightElement>
                            </InputGroup>

                            {formMethods.formState.errors.storageInGb !== undefined ? (
                                <FormErrorMessage>
                                    {formMethods.formState.errors.storageInGb.message}
                                </FormErrorMessage>
                            ) : (
                                <FormHelperText>
                                    Opcional. Caso não informado, será utilizado o armazenamento da
                                    instância.
                                </FormHelperText>
                            )}
                        </FormControl>
                    </ModalBody>

                    <ModalFooter justifyContent={'center'}>
                        <ButtonGroup>
                            <Button
                                colorScheme='gray'
                                onClick={onClose}
                                isDisabled={createTemplate.isPending}
                            >
                                Cancelar
                            </Button>

                            <Button
                                colorScheme='blue'
                                isLoading={createTemplate.isPending}
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onClick={formMethods.handleSubmit(submitHandler)}
                            >
                                Confirmar
                            </Button>
                        </ButtonGroup>
                    </ModalFooter>
                </FormProvider>
            </ModalContent>
        </Modal>
    );
};
