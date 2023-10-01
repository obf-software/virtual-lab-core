import {
    Button,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
} from '@chakra-ui/react';
import { ProductProvisioningParameter } from '../../../../services/api/protocols';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { FiUploadCloud } from 'react-icons/fi';

interface ProvisioningModalProps {
    parameters: ProductProvisioningParameter[];
    isOpen: boolean;
    onClose: () => void;
}

interface ProvisioProductFormData {}

export const ProvisioningModal: React.FC<ProvisioningModalProps> = ({
    isOpen,
    onClose,
    parameters,
}) => {
    const formMethods = useForm<ProvisioProductFormData>();

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

                        <ModalHeader>Provisionar Nova Instância</ModalHeader>

                        <ModalBody>
                            {parameters.map((parameter, i) => (
                                <FormControl
                                    mb={'2%'}
                                    key={`provisioning-parameter-${i}`}
                                    isRequired={parameter.DefaultValue === undefined}
                                >
                                    <FormLabel>
                                        {parameter.Description ?? parameter.ParameterKey}
                                    </FormLabel>
                                    {parameter.ParameterConstraints.AllowedValues === undefined ||
                                    parameter.ParameterConstraints.AllowedValues.length === 0 ? (
                                        <Input defaultValue={parameter.DefaultValue}></Input>
                                    ) : (
                                        <Select>
                                            {parameter.ParameterConstraints.AllowedValues.map(
                                                (allowedValue, i) => (
                                                    <option
                                                        key={`allowed-value-${i}`}
                                                        value={allowedValue}
                                                        selected={
                                                            allowedValue === parameter.DefaultValue
                                                        }
                                                    >
                                                        {allowedValue}
                                                    </option>
                                                ),
                                            )}
                                        </Select>
                                    )}

                                    {/* <pre key={`provisioning-parameter-${i}`}>
                                        {JSON.stringify(parameter, null, 2)}
                                    </pre> */}
                                </FormControl>
                            ))}
                        </ModalBody>

                        <ModalFooter>
                            <Button
                                leftIcon={<FiUploadCloud />}
                                colorScheme='blue'
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
