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
    InputGroup,
    InputRightElement,
    IconButton,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Controller, FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { UserRole } from '../../../services/api/protocols';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { GroupBase, Select as MultiSelect, OptionBase } from 'chakra-react-select';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface CreateUserFormData {
    name: string;
    username: string;
    email: string;
    password: string;
    role: keyof typeof UserRole;
    groups: string[];
}

interface MultiSelectGroups extends OptionBase {
    value: string;
}

interface SingleSelectRole extends OptionBase {
    value: string;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose }) => {
    const [showPassword, setShowPassword] = useState<boolean>(true);
    const formMethods = useForm<CreateUserFormData>({
        defaultValues: {
            role: 'USER',
        },
    });

    useEffect(() => {
        return () => {
            formMethods.reset();
        };
    }, []);

    const submitHandler: SubmitHandler<CreateUserFormData> = (values) => {
        console.log(values);

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
                        <Heading fontWeight={'medium'}>Adicionar Usuário</Heading>
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
                                        value: 3,
                                        message: 'O nome deve ter no mínimo 3 caracteres',
                                    },
                                    maxLength: {
                                        value: 50,
                                        message: 'O nome deve ter no máximo 50 caracteres',
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
                            isInvalid={formMethods.formState.errors.username !== undefined}
                        >
                            <FormLabel htmlFor='username'>Usuário</FormLabel>
                            <Input
                                id='username'
                                {...formMethods.register('username', {
                                    required: 'Campo obrigatório',
                                    minLength: {
                                        value: 3,
                                        message: 'O nome deve ter no mínimo 3 caracteres',
                                    },
                                    maxLength: {
                                        value: 50,
                                        message: 'O nome deve ter no máximo 50 caracteres',
                                    },
                                })}
                            />
                            <FormErrorMessage>
                                {formMethods.formState.errors.username?.message}
                            </FormErrorMessage>
                        </FormControl>

                        <FormControl
                            mt={'2%'}
                            isRequired
                            isInvalid={formMethods.formState.errors.email !== undefined}
                        >
                            <FormLabel htmlFor='email'>Email</FormLabel>
                            <Input
                                id='email'
                                {...formMethods.register('email', {
                                    required: 'Campo obrigatório',
                                    pattern: {
                                        value: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
                                        message: 'Email inválido',
                                    },
                                })}
                            />
                            <FormErrorMessage>
                                {formMethods.formState.errors.email?.message}
                            </FormErrorMessage>
                        </FormControl>

                        <Controller
                            control={formMethods.control}
                            name='role'
                            render={({ field, fieldState }) => (
                                <FormControl
                                    mt={'2%'}
                                    isInvalid={fieldState.error !== undefined}
                                    isRequired
                                >
                                    <FormLabel htmlFor='role'>Cargo</FormLabel>

                                    <MultiSelect<
                                        SingleSelectRole,
                                        false,
                                        GroupBase<SingleSelectRole>
                                    >
                                        id='role'
                                        name={field.name}
                                        ref={field.ref}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        options={[...Object.keys(UserRole)].map((role) => ({
                                            value: role,
                                            label: role.toUpperCase(),
                                        }))}
                                        closeMenuOnSelect={true}
                                    />

                                    <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                                </FormControl>
                            )}
                        />

                        <Controller
                            control={formMethods.control}
                            name='groups'
                            render={({ field, fieldState }) => (
                                <FormControl
                                    mt={'2%'}
                                    isInvalid={fieldState.error !== undefined}
                                >
                                    <FormLabel htmlFor='groups'>Grupos</FormLabel>

                                    <MultiSelect<
                                        MultiSelectGroups,
                                        true,
                                        GroupBase<MultiSelectGroups>
                                    >
                                        id='groups'
                                        placeholder='Selecione'
                                        isMulti
                                        name={field.name}
                                        ref={field.ref}
                                        onChange={field.onChange}
                                        onBlur={field.onBlur}
                                        options={[
                                            { value: '1', label: 'Grupo 1' },
                                            { value: '2', label: 'Grupo 2' },
                                            { value: '3', label: 'Grupo 3' },
                                        ]}
                                        closeMenuOnSelect={false}
                                    />

                                    <FormErrorMessage>{fieldState.error?.message}</FormErrorMessage>
                                </FormControl>
                            )}
                        />

                        <FormControl
                            mt={'2%'}
                            isRequired
                            isInvalid={formMethods.formState.errors.password !== undefined}
                        >
                            <FormLabel htmlFor='password'>Senha</FormLabel>
                            <InputGroup>
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    id='password'
                                    {...formMethods.register('password', {
                                        required: 'Campo obrigatório',
                                        minLength: {
                                            value: 8,
                                            message: 'A senha deve ter no mínimo 8 caracteres',
                                        },
                                    })}
                                />
                                <InputRightElement>
                                    <IconButton
                                        aria-label='Mostrar/esconder senha'
                                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                                        variant='ghost'
                                        size='sm'
                                        onClick={() => setShowPassword(!showPassword)}
                                    />
                                </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>
                                {formMethods.formState.errors.password?.message}
                            </FormErrorMessage>
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
