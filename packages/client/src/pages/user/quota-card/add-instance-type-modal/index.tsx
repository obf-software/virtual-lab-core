import React from 'react';
import { InstanceType } from '../../../../services/api-protocols';
import {
    Heading,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
} from '@chakra-ui/react';
import { useInstanceTypes } from '../../../../hooks/use-instance-types';

interface UserPageQuotaCardAddInstanceTypeModalProps {
    userInstanceTypes: InstanceType[];
    isOpen: boolean;
    onClose: () => void;
}

export const UserPageQuotaCardAddInstanceTypeModal: React.FC<
    UserPageQuotaCardAddInstanceTypeModalProps
> = ({ userInstanceTypes, isOpen, onClose }) => {
    const { instanceTypesQuery } = useInstanceTypes();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            motionPreset='scale'
            isCentered
            closeOnEsc
            closeOnOverlayClick
            size={{ base: 'sm', md: '6xl' }}
        >
            <ModalOverlay>
                <ModalContent>
                    <ModalCloseButton />

                    <ModalHeader fontSize='lg'>
                        <Heading
                            size='lg'
                            fontWeight='semibold'
                        >
                            Adicionar tipo de instância
                        </Heading>
                    </ModalHeader>

                    <ModalBody>
                        <List>
                            {instanceTypesQuery.data?.map((instanceType) => (
                                <ListItem key={instanceType.name}>{instanceType.name}</ListItem>
                            ))}
                        </List>
                    </ModalBody>
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
};
