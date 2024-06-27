import {
    Button,
    ButtonGroup,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    Icon,
    Input,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    Tooltip,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import {
    FiCalendar,
    FiClock,
    FiCopy,
    FiEdit,
    FiFilm,
    FiSave,
    FiShoppingBag,
    FiTrash,
    FiUser,
    FiX,
} from 'react-icons/fi';
import { BiHdd } from 'react-icons/bi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { IconType } from 'react-icons';
import { InstanceTemplate } from '../../../services/api-protocols';
import { bytesToHumanReadable, getInstancePlatformIcon } from '../../../services/helpers';
import { ConfirmDeletionAlertDialog } from '../../../components/confirm-deletion-alert-dialog';
import { useInstanceTemplateOperations } from '../../../hooks/use-instance-template-operations';
import { SubmitHandler, useForm } from 'react-hook-form';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('pt-br');

interface EditFormProps {
    name: string;
    description: string;
}

interface TemplatesPageCardProps {
    instanceTemplate: InstanceTemplate;
    isDisabled: boolean;
    onCopy: () => void;
}

export const TemplatesPageCard: React.FC<TemplatesPageCardProps> = ({
    instanceTemplate,
    isDisabled,
    onCopy,
}) => {
    const [editableName, setEditableName] = React.useState(instanceTemplate.name);
    const [editableDescription, setEditableDescription] = React.useState(
        instanceTemplate.description,
    );
    const { deleteInstanceTemplate, updateInstanceTemplate } = useInstanceTemplateOperations();
    const deleteDisclosure = useDisclosure();
    const editDisclosure = useDisclosure();
    const formMethods = useForm<EditFormProps>({
        defaultValues: {
            name: editableName,
            description: editableDescription,
        },
    });
    const toast = useToast();

    const submitEditForm: SubmitHandler<EditFormProps> = (data) => {
        updateInstanceTemplate.mutate(
            {
                instanceTemplateId: instanceTemplate.id,
                name: data.name,
                description: data.description,
            },
            {
                onSuccess: () => {
                    setEditableName(data.name);
                    setEditableDescription(data.description);
                    formMethods.reset({
                        name: data.name,
                        description: data.description,
                    });
                    editDisclosure.onClose();
                },
                onError: (error) => {
                    toast({
                        title: 'Erro ao atualizar template',
                        description: error.message,
                        status: 'error',
                        isClosable: true,
                    });
                },
            },
        );
    };

    const gridItems: {
        icon: IconType;
        label: string;
        value: string;
    }[] = [
        {
            icon: getInstancePlatformIcon(instanceTemplate.platform),
            label: 'Sistema operacional',
            value: instanceTemplate.distribution,
        },
        {
            icon: BiHdd,
            label: 'Armazenamento',
            value: bytesToHumanReadable(instanceTemplate.storageInGb, 'GB'),
        },
        {
            icon: FiUser,
            label: 'Id do criador',
            value: instanceTemplate.createdBy,
        },
        {
            icon: FiShoppingBag,
            label: 'Id do produto',
            value: instanceTemplate.productId,
        },
        {
            icon: FiFilm,
            label: 'Id da imagem da máquina',
            value: instanceTemplate.machineImageId,
        },
        {
            icon: FiCalendar,
            label: 'Criada em',
            value: dayjs(instanceTemplate.createdAt).format('DD/MM/YYYY'),
        },
        {
            icon: FiClock,
            label: 'Atualizada em',
            value: dayjs(instanceTemplate.updatedAt).format('DD/MM/YYYY'),
        },
    ];

    return (
        <Card
            borderRadius='xl'
            boxShadow='md'
            overflow='hidden'
            width={{ base: '100%' }}
            p={4}
            margin='auto'
        >
            <ConfirmDeletionAlertDialog
                title='Excluir template'
                text='Tem certeza que deseja excluir este template? Esta ação é irreversível.'
                isOpen={deleteDisclosure.isOpen}
                onClose={deleteDisclosure.onClose}
                onConfirm={() =>
                    deleteInstanceTemplate.mutate({
                        instanceTemplateId: instanceTemplate.id,
                    })
                }
                isLoading={deleteInstanceTemplate.isPending}
            />

            <FormControl>
                <CardHeader textAlign='center'>
                    {editDisclosure.isOpen ? (
                        <>
                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.name !== undefined}
                            >
                                <FormLabel fontWeight={'bold'}>Nome do template</FormLabel>
                                <Input
                                    {...formMethods.register('name', {
                                        required: 'Nome do template é obrigatório',
                                        minLength: {
                                            value: 3,
                                            message:
                                                'Nome do template deve ter no mínimo 3 caracteres',
                                        },
                                        maxLength: {
                                            value: 100,
                                            message:
                                                'Nome do template deve ter no máximo 100 caracteres',
                                        },
                                    })}
                                />
                                <FormErrorMessage>
                                    {formMethods.formState.errors.name?.message}
                                </FormErrorMessage>
                            </FormControl>

                            <FormControl
                                isRequired
                                isInvalid={formMethods.formState.errors.description !== undefined}
                                mt={5}
                            >
                                <FormLabel fontWeight={'bold'}>Descrição</FormLabel>
                                <Textarea
                                    {...formMethods.register('description', {
                                        required: 'Descrição é obrigatória',
                                        minLength: {
                                            value: 3,
                                            message: 'Descrição deve ter no mínimo 3 caracteres',
                                        },
                                        maxLength: {
                                            value: 500,
                                            message: 'Descrição deve ter no máximo 500 caracteres',
                                        },
                                    })}
                                />
                                <FormErrorMessage>
                                    {formMethods.formState.errors.description?.message}
                                </FormErrorMessage>
                            </FormControl>
                        </>
                    ) : (
                        <>
                            <Heading
                                size='lg'
                                noOfLines={2}
                            >
                                {editableName}
                            </Heading>

                            <Text
                                size={'lg'}
                                color={'gray.600'}
                                mt={5}
                                noOfLines={3}
                            >
                                {editableDescription}
                            </Text>
                        </>
                    )}
                </CardHeader>

                <CardBody textAlign={'center'}>
                    <SimpleGrid
                        columns={{ base: 1, md: 3 }}
                        spacing={6}
                    >
                        {gridItems.map(({ icon, label, value }, index) => (
                            <Tooltip
                                label={`${label}: ${value}`}
                                key={`instance-${instanceTemplate.id}-grid-item-${index}`}
                            >
                                <Stack
                                    key={value}
                                    direction='row'
                                    spacing={4}
                                    align='center'
                                >
                                    <Icon
                                        aria-label={value}
                                        as={icon}
                                        boxSize={'24px'}
                                    />
                                    <Text
                                        fontSize={'larger'}
                                        noOfLines={1}
                                        isTruncated
                                    >
                                        {value}
                                    </Text>
                                </Stack>
                            </Tooltip>
                        ))}
                    </SimpleGrid>
                </CardBody>

                <CardFooter justifyContent='center'>
                    <ButtonGroup>
                        {editDisclosure.isOpen ? (
                            <>
                                <Button
                                    leftIcon={<FiSave />}
                                    colorScheme='green'
                                    isDisabled={isDisabled}
                                    isLoading={updateInstanceTemplate.isPending}
                                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                    onClick={formMethods.handleSubmit(submitEditForm)}
                                >
                                    Salvar
                                </Button>

                                <Button
                                    leftIcon={<FiX />}
                                    isDisabled={isDisabled || updateInstanceTemplate.isPending}
                                    onClick={() => {
                                        formMethods.reset();
                                        editDisclosure.onClose();
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    leftIcon={<FiEdit />}
                                    colorScheme='blue'
                                    isDisabled={isDisabled}
                                    onClick={editDisclosure.onOpen}
                                >
                                    Editar
                                </Button>

                                <Button
                                    leftIcon={<FiCopy />}
                                    colorScheme='blue'
                                    variant={'outline'}
                                    isDisabled={isDisabled}
                                    onClick={onCopy}
                                >
                                    Copiar
                                </Button>

                                <Button
                                    leftIcon={<FiTrash />}
                                    colorScheme='red'
                                    isDisabled={isDisabled}
                                    onClick={deleteDisclosure.onOpen}
                                >
                                    Excluir
                                </Button>
                            </>
                        )}
                    </ButtonGroup>
                </CardFooter>
            </FormControl>
        </Card>
    );
};
