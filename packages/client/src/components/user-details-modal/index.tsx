import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Heading,
    Tab,
    TabList,
    TabPanels,
    Tabs,
} from '@chakra-ui/react';
import React from 'react';
import { User } from '../../services/api/protocols';
import { UserDetailsModalInfoTabPanel } from './info-tab-panel';
import { UserDetailsModalQuotasTabPanel } from './quotas-tab-panel';
import { UserDetailsModalGroupsTabPanel } from './groups-tab-panel';

interface UserDetailsModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, isOpen, onClose }) => {
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
                            Detalhes do usuário {user.username}
                        </Heading>
                    </ModalHeader>

                    <ModalBody>
                        <Tabs>
                            <TabList>
                                <Tab>Info</Tab>
                                <Tab>Quotas</Tab>
                                <Tab>Grupos</Tab>
                            </TabList>
                            <TabPanels>
                                <UserDetailsModalInfoTabPanel user={user} />
                                <UserDetailsModalQuotasTabPanel user={user} />
                                <UserDetailsModalGroupsTabPanel user={user} />
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
};
