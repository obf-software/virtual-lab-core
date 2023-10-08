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
import { provisionProduct } from '../../../../services/api/service';

interface ProvisioningModalProps {
    product: Product;
    launchPath: string;
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
    launchPath,
}) => {
    const formMethods = useForm<ProvisioProductFormData>();
    const [isLoading, setIsLoading] = React.useState(false);
    const navigate = useNavigate();
    const toast = useToast();

    const submitHandler: SubmitHandler<ProvisioProductFormData> = async (data) => {
        setIsLoading(true);

        const { error } = await provisionProduct(
            'me',
            product.awsProductId,
            launchPath,
            Object.entries(data.parameters).map(([key, value]) => ({ key, value })),
        );

        setIsLoading(false);

        if (error !== undefined) {
            toast({
                title: 'Erro ao provisionar produto',
                description: error,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        toast({
            title: 'Produto provisionado',
            description:
                'Seu produto está sendo preparado para uso e será disponibilizado em breve',
            status: 'success',
            duration: 5000,
            isClosable: true,
        });

        navigate(`/instances`);
    };

    const getParameterLabel = (parameter: ProductProvisioningParameter) => {
        if (parameter.Description === 'Instance Type') {
            return 'Tipo de instância';
        }

        if (parameter.Description !== undefined) {
            return parameter.Description;
        }

        if (parameter.ParameterKey !== undefined) {
            return parameter.ParameterKey;
        }

        return 'Parâmetro sem nome';
    };

    return (
        <Modal
            isCentered
            size={{ base: '6xl', md: '2xl' }}
            closeOnEsc
            scrollBehavior='outside'
            isOpen={isOpen}
            onClose={() => {
                onClose();
            }}
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

                            {parameters
                                .filter((parameter) => parameter.ParameterType === 'String')
                                .map((parameter, i) => (
                                    <FormControl
                                        mb={'2%'}
                                        key={`provisioning-parameter-${i}`}
                                        isRequired={parameter.DefaultValue === undefined}
                                    >
                                        <FormLabel>{getParameterLabel(parameter)}</FormLabel>
                                        {parameter.ParameterConstraints.AllowedValues ===
                                            undefined ||
                                        parameter.ParameterConstraints.AllowedValues.length ===
                                            0 ? (
                                            <Input
                                                defaultValue={parameter.DefaultValue}
                                                {...formMethods.register(
                                                    `parameters.${parameter.ParameterKey}`,
                                                )}
                                            ></Input>
                                        ) : (
                                            <Select
                                                {...formMethods.register(
                                                    `parameters.${parameter.ParameterKey}`,
                                                )}
                                            >
                                                {parameter.ParameterConstraints.AllowedValues.map(
                                                    (allowedValue, i) => (
                                                        <option
                                                            key={`allowed-value-${i}`}
                                                            value={allowedValue}
                                                            selected={
                                                                allowedValue ===
                                                                parameter.DefaultValue
                                                            }
                                                        >
                                                            {allowedValue}
                                                        </option>
                                                    ),
                                                )}
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
                                isLoading={isLoading}
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
