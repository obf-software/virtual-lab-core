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

interface ConfirmDeletionAlertDialogProps {
    title: string;
    text: string;

    onConfirm: () => void;
    onClose: () => void;
    isOpen: boolean;
    isLoading: boolean;
}

export const ConfirmDeletionAlertDialog: React.FC<ConfirmDeletionAlertDialogProps> = ({
    title,
    text,
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
                    <AlertDialogHeader fontSize='lg'>{title}</AlertDialogHeader>

                    <AlertDialogBody>{text}</AlertDialogBody>

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
