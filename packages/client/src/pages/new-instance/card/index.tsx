import {
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    Heading,
    Stack,
    Wrap,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import { Product } from '../../../services/api/protocols';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ProvisioningModal } from './provisioning-modal';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../../services/api/service';
import { getErrorMessage } from '../../../services/helpers';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface NewInstanceCardProps {
    product: Product;
}

export const NewInstanceCard: React.FC<NewInstanceCardProps> = ({ product }) => {
    const provisioningModalDisclosure = useDisclosure();
    const toast = useToast();

    const provisioningParametersQuery = useQuery({
        queryKey: ['productsProvisioningParameters', product.awsProductId],
        queryFn: async () => {
            const { data, error } = await api.getProductProvisioningParameters(
                product.awsProductId,
            );
            if (error !== undefined) throw new Error(error);
            return data;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return (
        <Card>
            <ProvisioningModal
                isOpen={provisioningModalDisclosure.isOpen}
                onClose={provisioningModalDisclosure.onClose}
                parameters={provisioningParametersQuery.data?.provisioningParameters ?? []}
                product={product}
                launchPathId={provisioningParametersQuery.data?.launchPathId ?? ''}
            />
            <CardHeader>
                <Stack
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 5, md: 10 }}
                >
                    <Heading size='xl'>{product.name}</Heading>
                </Stack>
            </CardHeader>
            <CardBody>
                <Heading size={'md'}>{product.description}</Heading>
            </CardBody>
            <CardFooter>
                <Wrap spacingY={4}>
                    <Button
                        leftIcon={<FiUploadCloud />}
                        colorScheme='blue'
                        isLoading={
                            provisioningParametersQuery.isLoading ||
                            provisioningParametersQuery.isFetching
                        }
                        onClick={() => {
                            if (provisioningParametersQuery.data === undefined) {
                                provisioningParametersQuery
                                    .refetch()
                                    .then(({ data }) => {
                                        if (data === undefined)
                                            throw new Error('Erro desconhecido');
                                        provisioningModalDisclosure.onOpen();
                                    })
                                    .catch((error) => {
                                        toast({
                                            title: 'Erro ao carregar parâmetros de provisionamento',
                                            description: getErrorMessage(error),
                                            status: 'error',
                                            isClosable: true,
                                        });
                                    });
                                return;
                            }

                            provisioningModalDisclosure.onOpen();
                        }}
                    >
                        Provisionar
                    </Button>
                </Wrap>
            </CardFooter>
        </Card>
    );
};
