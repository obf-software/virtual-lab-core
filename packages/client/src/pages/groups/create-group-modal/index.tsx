/* eslint-disable @typescript-eslint/no-misused-promises */
import {
    FormControl,
    FormErrorMessage,
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
    Button,
    useToast,
    Textarea,
    FormHelperText,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { createGroup, listPortfolios } from '../../../services/api/service';
import { useGroupsContext } from '../../../contexts/groups/hook';
import { Select } from 'chakra-react-select';
import { useQuery } from '@tanstack/react-query';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CreateGroupFormData {
    name: string;
    description: string;
    portfolioId: string;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
    const { loadGroupsPage } = useGroupsContext();
    const formMethods = useForm<CreateGroupFormData>();
    const toast = useToast();

    useEffect(() => {
        return () => {
            formMethods.reset();
        };
    }, []);

    const portfoliosQuery = useQuery({
        queryKey: ['portfolios'],
        queryFn: async () => {
            const response = await listPortfolios();
            if (response.error !== undefined) throw new Error(response.error);
            console.log(response.data);
            return response.data;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const submitHandler: SubmitHandler<CreateGroupFormData> = async (values) => {
        const { error } = await createGroup({
            name: values.name,
            description: values.description,
            portfolioId: values.portfolioId,
        });

        if (error !== undefined) {
            toast({
                title: 'Erro ao criar grupo',
                description: error,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        loadGroupsPage(1, 20).catch(console.error);
        formMethods.reset();
        onClose();
    };

    return (
        <Modal
            isCentered
            isOpen={isOpen}
            onClose={() => {
                formMethods.reset();
                onClose();
            }}
            size={{ base: '6xl', md: '2xl' }}
            closeOnEsc
            scrollBehavior='outside'
        >
            <ModalOverlay
                bg={'blackAlpha.300'}
                backdropFilter={'blur(10px)'}
            />

            <ModalContent>
                <FormProvider {...formMethods}>
                    <ModalCloseButton />

                    <ModalHeader>
                        <Heading fontWeight={'medium'}>Novo Grupo</Heading>
                    </ModalHeader>

                    <ModalBody>
                        <FormControl
                            isRequired
                            isInvalid={formMethods.formState.errors.name !== undefined}
                        >
                            <FormLabel htmlFor='name'>Nome</FormLabel>
                            <Input
                                id='name'
                                {...formMethods.register('name', {
                                    required: 'Campo obrigatório',
                                    minLength: {
                                        value: 1,
                                        message: 'O nome deve ter no mínimo 1 caracter',
                                    },
                                    maxLength: {
                                        value: 128,
                                        message: 'O nome deve ter no máximo 128 caracteres',
                                    },
                                })}
                            />
                            <FormErrorMessage>
                                {formMethods.formState.errors.name?.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl
                            mt={'2%'}
                            isRequired
                            isInvalid={formMethods.formState.errors.description !== undefined}
                        >
                            <FormLabel htmlFor='description'>Descrição</FormLabel>
                            <Textarea
                                id='description'
                                {...formMethods.register('description', {
                                    required: 'Campo obrigatório',
                                    minLength: {
                                        value: 1,
                                        message: 'O nome deve ter no mínimo 1 caracter',
                                    },
                                })}
                            />
                            <FormErrorMessage>
                                {formMethods.formState.errors.description?.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl
                            mt={'2%'}
                            isRequired
                            isInvalid={formMethods.formState.errors.portfolioId !== undefined}
                        >
                            <FormLabel htmlFor='portfolioId'>Portfólio</FormLabel>
                            <Select
                                name='Portfólio'
                                placeholder='Selecione'
                                isLoading={portfoliosQuery.isLoading || portfoliosQuery.isFetching}
                                options={portfoliosQuery.data?.map((option) => ({
                                    value: option.id,
                                    label: `${option.name} (${option.id})`,
                                }))}
                                onChange={(option) => {
                                    formMethods.setValue('portfolioId', option?.value ?? '');
                                }}
                            />
                            {/* <Input
                                id='portfolioId'
                                {...formMethods.register('portfolioId', {
                                    required: 'Campo obrigatório',
                                    minLength: {
                                        value: 1,
                                        message: 'O campo deve ter no mínimo 1 caracter',
                                    },
                                    maxLength: {
                                        value: 50,
                                        message: 'O campo deve ter no máximo 50 caracteres',
                                    },
                                })}
                            /> */}
                            <FormErrorMessage>
                                {formMethods.formState.errors.portfolioId?.message}
                            </FormErrorMessage>
                            <FormHelperText>
                                O id do portfólio pode ser encontrado no AWS Service Catalog. O
                                formato é: port-xxxxxxxxxxxxx
                            </FormHelperText>
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            colorScheme={'blue'}
                            variant='solid'
                            onClick={formMethods.handleSubmit(submitHandler)}
                            isLoading={formMethods.formState.isSubmitting}
                        >
                            Adicionar
                        </Button>
                    </ModalFooter>
                </FormProvider>
            </ModalContent>
        </Modal>
    );
};
