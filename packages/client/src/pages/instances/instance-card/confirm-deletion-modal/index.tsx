import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
} from '@chakra-ui/react';
import React from 'react';

interface ConfirmDeletionModalProps {
    instanceName: string;

    onConfirm: () => void;
    onClose: () => void;
    isOpen: boolean;
    isLoading: boolean;
}

export const ConfirmDeletionModal: React.FC<ConfirmDeletionModalProps> = ({
    instanceName,
    isOpen,
    isLoading,
    onClose,
    onConfirm,
}) => {
    const cancelRef = React.useRef<HTMLButtonElement>(null);

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
            motionPreset='scale'
            isCentered
            closeOnEsc={!isLoading}
            closeOnOverlayClick={!isLoading}
            leastDestructiveRef={cancelRef}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize='lg'>Excluir Instância</AlertDialogHeader>

                    <AlertDialogBody>
                        Você tem certeza que deseja deletar a instância{' '}
                        <strong>{instanceName}</strong>? Essa ação não pode ser desfeita e todos os
                        dados serão perdidos.
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button
                            ref={cancelRef}
                            onClick={onClose}
                            isDisabled={isLoading}
                        >
                            Cancelar
                        </Button>

                        <Button
                            colorScheme='red'
                            onClick={onConfirm}
                            isLoading={isLoading}
                            ml={3}
                        >
                            Excluir
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};
