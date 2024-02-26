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
import { Group } from '../../services/api-protocols';
import { GroupDetailsModalInfoTabPanel } from './info-tab-panel';
import { GroupDetailsModalUsersTabPanel } from './users-tab-panel';
import { useAuthSessionData } from '../../hooks/use-auth-session-data';

interface GroupDetailsModalProps {
    group: Group;
    isOpen: boolean;
    onClose: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({ group, isOpen, onClose }) => {
    const { authSessionData } = useAuthSessionData();
    const isAdmin = authSessionData?.role === 'ADMIN';

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
                            Detalhes do grupo
                        </Heading>
                    </ModalHeader>

                    <ModalBody>
                        <Tabs>
                            <TabList>
                                <Tab>Info</Tab>

                                <Tab hidden={!isAdmin}>Usuários</Tab>
                            </TabList>
                            <TabPanels>
                                <GroupDetailsModalInfoTabPanel
                                    group={group}
                                    isEditable={isAdmin}
                                />
                                {isAdmin ? <GroupDetailsModalUsersTabPanel group={group} /> : null}
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
};
