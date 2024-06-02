import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Heading,
    Icon,
    SimpleGrid,
    Stack,
    Text,
    Tooltip,
    useDisclosure,
} from '@chakra-ui/react';
import React from 'react';
import { FiCalendar, FiClock, FiPlus } from 'react-icons/fi';
import { NewInstancePageCardLaunchModal } from './launch-modal';
import { BiHdd } from 'react-icons/bi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { IconType } from 'react-icons';
import { InstanceTemplate } from '../../../services/api-protocols';
import { bytesToHumanReadable, getInstancePlatformIcon } from '../../../services/helpers';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('pt-br');

interface NewInstancePageCardProps {
    instanceTemplate: InstanceTemplate;
    isLoading: boolean;
    isDisabled: boolean;
}

export const NewInstancePageCard: React.FC<NewInstancePageCardProps> = ({
    instanceTemplate,
    isLoading,
    isDisabled,
}) => {
    const launchInstanceModalDisclosure = useDisclosure();
    const gridItems: { icon: IconType; label: string; value: string }[] = [
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
            height={{ base: '100%' }}
            p={4}
            margin='auto'
        >
            <NewInstancePageCardLaunchModal
                instanceTemplate={instanceTemplate}
                isOpen={launchInstanceModalDisclosure.isOpen}
                onClose={launchInstanceModalDisclosure.onClose}
            />

            <CardHeader textAlign='center'>
                <Heading
                    size='lg'
                    noOfLines={2}
                >
                    {instanceTemplate.name}
                </Heading>

                <Text
                    size={'lg'}
                    color={'gray.600'}
                    mt={5}
                    noOfLines={3}
                >
                    {instanceTemplate.description}
                </Text>
            </CardHeader>

            <CardBody textAlign={'center'}>
                <SimpleGrid
                    columns={{ base: 1, md: 2 }}
                    spacing={4}
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
                                    overflow={'clip'}
                                >
                                    {value}
                                </Text>
                            </Stack>
                        </Tooltip>
                    ))}
                </SimpleGrid>
            </CardBody>

            <CardFooter justifyContent='center'>
                <Button
                    leftIcon={<FiPlus />}
                    colorScheme='blue'
                    isLoading={isLoading}
                    isDisabled={isDisabled}
                    onClick={launchInstanceModalDisclosure.onOpen}
                >
                    Criar a partir deste template
                </Button>
            </CardFooter>
        </Card>
    );
};
