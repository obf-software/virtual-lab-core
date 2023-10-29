import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Button,
    HStack,
    Heading,
    IconButton,
    Stack,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    useToast,
    Box,
    Input,
} from '@chakra-ui/react';
import React from 'react';
import { User } from '../../services/api/protocols';
import * as api from '../../services/api/service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';
import { GroupUsersTable } from '../group-users-table';
import { FiRefreshCw } from 'react-icons/fi';
import { Paginator } from '../paginator';
import { Select } from 'chakra-react-select';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface UserDetailsModalProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, isOpen, onClose }) => {
    const [page, setPage] = React.useState(1);
    const toast = useToast();

    const quotaTabData: {
        label: string;
        value: string;
        editable?: boolean;
        onChange?: (value: string) => void;
    }[] = [
        {
            label: 'Número máximo de instâncias',
            value: `${user.maxInstances}`,
            editable: true,
        },
    ];

    const infoTabData: {
        label: string;
        value: string;
        editable?: boolean;
        onChange?: (value: string) => void;
    }[] = [
        {
            label: 'Username',
            value: user.username,
            editable: true,
        },
        {
            label: 'Descrição',
            value: user.role,
            editable: true,
        },
        {
            label: 'Criado em',
            value: dayjs(user.createdAt).format('DD/MM/YYYY'),
        },
        {
            label: 'Atualizado',
            value: dayjs(user.updatedAt).fromNow(),
        },
        {
            label: 'Último login',
            value: dayjs(user.lastLoginAt).fromNow(),
        },
    ];

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
                                <TabPanel>
                                    <Stack
                                        mt={'2%'}
                                        spacing={2}
                                        direction='column'
                                    >
                                        {infoTabData.map((data) => (
                                            <React.Fragment key={data.label}>
                                                <Text
                                                    fontSize='lg'
                                                    color='gray.600'
                                                >
                                                    {data.label}
                                                </Text>

                                                {data.editable ? (
                                                    <Input
                                                        value={data.value}
                                                        onChange={(e) => {
                                                            data.onChange?.(e.target.value);
                                                        }}
                                                    />
                                                ) : (
                                                    <Text
                                                        fontSize='lg'
                                                        fontWeight='semibold'
                                                    >
                                                        {data.value}
                                                    </Text>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </Stack>

                                    <ModalFooter>
                                        <Button
                                            colorScheme='blue'
                                            // isLoading={updateGroupMutation.isLoading}
                                            // isDisabled={
                                            //     groupName === group.name &&
                                            //     groupDescription === group.description
                                            // }
                                            // onClick={() => {
                                            //     updateGroupMutation.mutate({
                                            //         groupId: group.id,
                                            //         name: groupName,
                                            //         description: groupDescription,
                                            //     });
                                            // }}
                                        >
                                            Salvar
                                        </Button>
                                    </ModalFooter>
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </ModalBody>
                </ModalContent>
            </ModalOverlay>
        </Modal>
    );
};
