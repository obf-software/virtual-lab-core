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
import * as api from '../../../services/api/service';
import { Select } from 'chakra-react-select';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '../../../services/query/service';
import { getErrorMessage } from '../../../services/helpers';

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
            const response = await api.listPortfolios();
            if (response.error !== undefined) throw new Error(response.error);
            console.log(response.data);
            return response.data;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const createGroupMutation = useMutation({
        mutationFn: async (mut: CreateGroupFormData) => {
            const { data, error } = await api.createGroup(mut);
            if (error !== undefined) throw new Error(error);
            return data;
        },
        onSuccess: (data) => {
            toast({
                title: `Grupo criado`,
                description: `O grupo ${data.name} foi criado com sucesso.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            queryClient.invalidateQueries(['groups']).catch(console.error);
            formMethods.reset();
            onClose();
        },
        onError: (error) => {
            toast({
                title: 'Falha ao criar grupo',
                status: 'error',
                description: getErrorMessage(error),
                duration: 5000,
                isClosable: true,
            });
        },
    });

    const submitHandler: SubmitHandler<CreateGroupFormData> = (values) => {
        createGroupMutation.mutate(values);
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
                            isLoading={
                                formMethods.formState.isSubmitting || createGroupMutation.isLoading
                            }
                        >
                            Adicionar
                        </Button>
                    </ModalFooter>
                </FormProvider>
            </ModalContent>
        </Modal>
    );
};
