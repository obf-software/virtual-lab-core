/* eslint-disable react/prop-types */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    HStack,
    Heading,
    Icon,
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
    Tooltip,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { InstanceTemplate, MachineImage } from '../../../services/api-protocols';
import { BiHdd, BiRocket } from 'react-icons/bi';
import { useInstanceTemplateOperations } from '../../../hooks/use-instance-template-operations';
import {
    CreatableSelect,
    GroupBase,
    OptionBase,
    SelectComponentsConfig,
    chakraComponents,
} from 'chakra-react-select';
import { useRecommendedMachineImages } from '../../../hooks/use-recommended-machine-images';
import { IconType } from 'react-icons';
import { bytesToHumanReadable, getInstancePlatformIcon } from '../../../services/helpers';

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

interface MachineImageOption extends OptionBase {
    label: string;
    value: string;
    machineImage?: MachineImage;
}

const machineImageSelectComponents: SelectComponentsConfig<
    MachineImageOption,
    false,
    GroupBase<MachineImageOption>
> = {
    Option: ({ children, ...props }) => {
        const gridItems: { icon: IconType; label: string; value: string }[] = [
            {
                icon: getInstancePlatformIcon(props.data.machineImage?.platform),
                label: 'Sistema operacional',
                value: props.data.machineImage?.distribution ?? 'Desconhecido',
            },
            {
                icon: BiHdd,
                label: 'Armazenamento mínimo',
                value: bytesToHumanReadable(props.data.machineImage?.storageInGb ?? 0, 'GB'),
            },
        ];

        return (
            <chakraComponents.Option {...props}>
                {props.data.machineImage !== undefined ? (
                    <VStack align={'start'}>
                        <Heading
                            size={'md'}
                            noOfLines={1}
                            mb={2}
                        >
                            {props.data.machineImage?.id}
                        </Heading>
                        {gridItems.map(({ icon, label, value }, index) => (
                            <Tooltip
                                label={`${label}: ${value}`}
                                key={`templates-page-create-modal-recommended-machine-images-${value}-${index}`}
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
                ) : (
                    children
                )}
            </chakraComponents.Option>
        );
    },
};

export const TemplatesPageCreateModal: React.FC<TemplatesPageCreateModalProps> = ({
    copyFrom,
    isOpen,
    onClose,
}) => {
    const { createInstanceTemplate } = useInstanceTemplateOperations();
    const { recommendedMachineImagesQuery } = useRecommendedMachineImages();
    const toast = useToast();
    const formMethods = useForm<TemplatesPageCreateModalForm>();

    const machineImageIdWatch = formMethods.watch('machineImageId');

    React.useEffect(() => {
        formMethods.clearErrors('machineImageId');
    }, [machineImageIdWatch]);

    React.useEffect(() => {
        if (!machineImageIdWatch) {
            return;
        }

        const selectedImage = recommendedMachineImagesQuery.data?.find(
            (image) => image.id === machineImageIdWatch,
        );

        if (selectedImage === undefined) {
            return;
        }

        formMethods.setValue('storageInGb', selectedImage.storageInGb.toString());
    }, [machineImageIdWatch, recommendedMachineImagesQuery.data]);

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
        if (!machineImageId) {
            formMethods.setError('machineImageId', {
                type: 'required',
                message: 'A imagem da máquina é obrigatória',
            });
            return;
        }

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
                                Imagem da máquina
                            </FormLabel>

                            <CreatableSelect
                                name='machineImageId'
                                placeholder='Escolha uma imagem'
                                selectedOptionColorScheme='blue'
                                formatCreateLabel={(inputValue) => `Usar imagem "${inputValue}"`}
                                isLoading={recommendedMachineImagesQuery.isLoading}
                                components={machineImageSelectComponents}
                                value={{
                                    label: machineImageIdWatch,
                                    value: machineImageIdWatch,
                                    machineImage: recommendedMachineImagesQuery.data?.find(
                                        (image) => image.id === machineImageIdWatch,
                                    ),
                                }}
                                options={
                                    recommendedMachineImagesQuery.data?.map((image) => ({
                                        label: image.id,
                                        value: image.id,
                                        machineImage: image,
                                    })) ?? []
                                }
                                onChange={(selected) => {
                                    formMethods.setValue('machineImageId', selected?.value ?? '');
                                }}
                            />

                            {formMethods.formState.errors.machineImageId?.message !== undefined ? (
                                <FormErrorMessage>
                                    {formMethods.formState.errors.machineImageId?.message}
                                </FormErrorMessage>
                            ) : (
                                <FormHelperText>
                                    <Text>
                                        Você pode escolher entre uma das imagens recomendadas ou
                                        informar o ID de uma imagem existente.
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
