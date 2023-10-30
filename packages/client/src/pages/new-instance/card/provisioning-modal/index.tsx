/* eslint-disable @typescript-eslint/no-misused-promises */
import {
    Button,
    Divider,
    FormControl,
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
    Text,
    useToast,
} from '@chakra-ui/react';
import { Product, ProductProvisioningParameter } from '../../../../services/api/protocols';
import React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { FiUploadCloud } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import * as api from '../../../../services/api/service';
import { useMutation } from '@tanstack/react-query';
import { getErrorMessage } from '../../../../services/helpers';
import { queryClient } from '../../../../services/query/service';

interface ProvisioningModalProps {
    product: Product;
    parameters: ProductProvisioningParameter[];
    isOpen: boolean;
    onClose: () => void;
}

interface ProvisioProductFormData {
    parameters: Record<string, string>;
}

export const ProvisioningModal: React.FC<ProvisioningModalProps> = ({
    isOpen,
    onClose,
    parameters,
    product,
}) => {
    const formMethods = useForm<ProvisioProductFormData>();
    const navigate = useNavigate();
    const toast = useToast();

    const provisionProductMutation = useMutation({
        mutationFn: async (mut: ProvisioProductFormData) => {
            const { data, error } = await api.provisionProduct('me', product.id, mut.parameters);
            if (error !== undefined) throw new Error(error);
            return data;
        },
        onSuccess: (data) => {
            toast({
                title: 'Instância em provisionamento',
                description: `A instância ${data.name} está sendo provisionada. Você será notificado quando ela estiver pronta para uso.`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            queryClient
                .invalidateQueries(['instances'])
                .catch(console.error)
                .finally(() => {
                    navigate(`/instances`);
                });
        },
        onError: (error) => {
            toast({
                title: 'Erro ao provisionar instância',
                description: getErrorMessage(error),
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        },
    });

    const submitHandler: SubmitHandler<ProvisioProductFormData> = (data) => {
        provisionProductMutation.mutate(data);
    };

    return (
        <Modal
            isCentered
            size={{ base: '6xl', md: '2xl' }}
            closeOnEsc={!provisionProductMutation.isLoading}
            scrollBehavior='outside'
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay
                bg={'blackAlpha.300'}
                backdropFilter={'blur(10px)'}
            >
                <ModalContent>
                    <FormProvider {...formMethods}>
                        <ModalCloseButton />

                        <ModalHeader>
                            <Heading size={'lg'}>{product.name}</Heading>
                        </ModalHeader>

                        <ModalBody>
                            <Text
                                mb={'5%'}
                                color={'gray.600'}
                                fontWeight={'bold'}
                            >
                                {product.description}
                            </Text>

                            <Divider
                                mb={'5%'}
                                hidden={parameters.length === 0}
                            />

                            <Heading
                                size={'md'}
                                mb={'5%'}
                                hidden={parameters.length === 0}
                            >
                                Parâmetros
                            </Heading>

                            {parameters.map((parameter, i) => (
                                <FormControl
                                    mb={'2%'}
                                    key={`provisioning-parameter-${i}`}
                                    isRequired={parameter.defaultValue === undefined}
                                    hidden={parameter.hidden}
                                >
                                    <FormLabel>{parameter.label}</FormLabel>
                                    {parameter.allowedValues === undefined ||
                                    parameter.allowedValues.length === 0 ? (
                                        <Input
                                            defaultValue={parameter.defaultValue}
                                            {...formMethods.register(`parameters.${parameter.key}`)}
                                        ></Input>
                                    ) : (
                                        <Select
                                            {...formMethods.register(`parameters.${parameter.key}`)}
                                        >
                                            {parameter.allowedValues.map((allowedValue, i) => (
                                                <option
                                                    key={`allowed-value-${i}`}
                                                    value={allowedValue}
                                                    selected={
                                                        allowedValue === parameter.defaultValue
                                                    }
                                                >
                                                    {allowedValue}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                </FormControl>
                            ))}
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                leftIcon={<FiUploadCloud />}
                                colorScheme='blue'
                                onClick={formMethods.handleSubmit(submitHandler)}
                                isLoading={provisionProductMutation.isLoading}
                            >
                                Provisionar
                            </Button>
                        </ModalFooter>
                    </FormProvider>
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
};
