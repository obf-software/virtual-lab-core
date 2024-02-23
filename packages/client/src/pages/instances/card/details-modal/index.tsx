import React from 'react';
import {
    Button,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from '@chakra-ui/react';
import { IconType } from 'react-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Instance } from '../../../../services/api-protocols';
import { instanceStateToDisplayString } from '../../../../services/helpers';

dayjs.locale('pt-br');
dayjs.extend(relativeTime);

interface InstancesPageCardDetailsModalProps {
    instance: Instance;
    isOpen: boolean;
    onClose: () => void;
}

export const InstancesPageCardDetailsModal: React.FC<InstancesPageCardDetailsModalProps> = ({
    instance,
    isOpen,
    onClose,
}) => {
    const detailItems: { icon?: IconType; label: string; value: string }[] = [
        {
            label: 'ID',
            value: instance.id,
        },
        {
            label: 'ID da instância virtual',
            value: instance.virtualId ?? '-',
        },
        {
            label: 'ID do produto',
            value: instance.productId,
        },
        {
            label: 'ID da imagem da máquina',
            value: instance.machineImageId,
        },
        {
            label: 'ID do dono',
            value: instance.ownerId,
        },
        {
            label: 'Token de provisionamento',
            value: instance.launchToken,
        },
        {
            label: 'Nome',
            value: instance.name,
        },
        {
            label: 'Descrição',
            value: instance.description,
        },
        {
            label: 'Tipo de conexão',
            value: instance.connectionType ?? '-',
        },
        {
            label: 'Hibernação',
            value: instance.canHibernate ? 'Habilitada' : 'Desabilitada',
        },
        {
            label: 'Plataforma',
            value: instance.platform,
        },
        {
            label: 'Distribuição',
            value: instance.distribution,
        },
        {
            label: 'Tipo de instância',
            value: instance.instanceType,
        },
        {
            label: 'CPU',
            value: instance.cpuCores,
        },
        {
            label: 'Memória',
            value: `${instance.memoryInGb} GB`,
        },
        {
            label: 'Armazenamento',
            value: `${instance.storageInGb} GB`,
        },
        {
            label: 'Criado em',
            value: `${dayjs(instance.createdAt).format('DD/MM/YYYY')} (${dayjs(instance.createdAt).fromNow()})`,
        },
        {
            label: 'Atualizado em',
            value: `${dayjs(instance.updatedAt).format('DD/MM/YYYY')} (${dayjs(instance.updatedAt).fromNow()})`,
        },
        {
            label: 'Última conexão',
            value: instance.lastConnectionAt
                ? `${dayjs(instance.lastConnectionAt).format('DD/MM/YYYY')} (${dayjs(instance.lastConnectionAt).fromNow()})`
                : '-',
        },
        {
            label: 'Estado',
            value: instanceStateToDisplayString(instance.state),
        },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            motionPreset='scale'
            isCentered
            closeOnOverlayClick
            closeOnEsc
        >
            <ModalOverlay />
            <ModalContent maxW={'xl'}>
                <ModalHeader>Detalhes da instância</ModalHeader>

                <ModalCloseButton />

                <ModalBody>
                    <List spacing={3}>
                        {detailItems.map((item, index) => (
                            <ListItem key={`instance-${instance.id}-detail-${item.label}-${index}`}>
                                <Text>
                                    <b>{item.label}</b>: {item.value}
                                </Text>
                            </ListItem>
                        ))}
                    </List>
                </ModalBody>

                <ModalFooter>
                    <Button
                        colorScheme='blue'
                        mr={3}
                        onClick={onClose}
                    >
                        Fechar
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
