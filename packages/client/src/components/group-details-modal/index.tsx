import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    Stack,
    Text,
} from '@chakra-ui/react';
import React from 'react';
import { Group } from '../../services/api/protocols';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface GroupDetailsModalProps {
    group: Group;
    isOpen: boolean;
    onClose: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ group, isOpen, onClose }) => {
    const cancelRef = React.useRef<HTMLButtonElement>(null);

    return (
        <AlertDialog
            isOpen={isOpen}
            onClose={onClose}
            motionPreset='scale'
            isCentered
            closeOnEsc
            closeOnOverlayClick
            leastDestructiveRef={cancelRef}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogCloseButton />

                    <AlertDialogHeader fontSize='lg'>Grupo {group.name}</AlertDialogHeader>

                    <AlertDialogBody>
                        <Stack
                            spacing={2}
                            direction='column'
                        >
                            <Text
                                fontSize='sm'
                                color='gray.600'
                            >
                                Descrição
                            </Text>
                            <Text
                                fontSize='md'
                                fontWeight='semibold'
                            >
                                {group.description}
                            </Text>
                            <Text
                                fontSize='sm'
                                color='gray.600'
                            >
                                Id do portfólio
                            </Text>
                            <Text
                                fontSize='md'
                                fontWeight='semibold'
                            >
                                {group.portfolioId}
                            </Text>
                            <Text
                                fontSize='sm'
                                color='gray.600'
                            >
                                Criado em
                            </Text>
                            <Text
                                fontSize='md'
                                fontWeight='semibold'
                            >
                                {dayjs(group.createdAt).format('DD/MM/YYYY')}
                            </Text>
                            <Text
                                fontSize='sm'
                                color='gray.600'
                            >
                                Atualizado
                            </Text>
                            <Text
                                fontSize='md'
                                fontWeight='semibold'
                            >
                                {dayjs(group.updatedAt).fromNow()}
                            </Text>
                        </Stack>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button
                            ref={cancelRef}
                            onClick={onClose}
                        >
                            Fechar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};
