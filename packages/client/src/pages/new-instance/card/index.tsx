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
import { Product, ProductProvisioningParameter } from '../../../services/api/protocols';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useProductsContext } from '../../../contexts/products/hook';
import { ProvisioningModal } from './provisioning-modal';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

interface NewInstanceCardProps {
    product: Product;
}

export const NewInstanceCard: React.FC<NewInstanceCardProps> = ({ product }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const { loadProductProvisioningParameters } = useProductsContext();
    const [parameters, setParameters] = React.useState<ProductProvisioningParameter[]>([]);
    const provisioningModalDisclosure = useDisclosure();
    const toast = useToast();

    return (
        <Card>
            <ProvisioningModal
                isOpen={provisioningModalDisclosure.isOpen}
                onClose={provisioningModalDisclosure.onClose}
                parameters={parameters}
                product={product}
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
                        isLoading={isLoading}
                        onClick={() => {
                            setIsLoading(true);
                            loadProductProvisioningParameters(product.awsProductId)
                                .then((provisioningParameters) => {
                                    setParameters(provisioningParameters);
                                    setIsLoading(false);
                                    provisioningModalDisclosure.onOpen();
                                })
                                .catch((error) => {
                                    setIsLoading(false);
                                    toast({
                                        title: 'Erro ao carregar parâmetros de provisionamento',
                                        description:
                                            error instanceof Error
                                                ? error.message
                                                : 'Erro desconhecido',
                                        status: 'error',
                                        duration: 5000,
                                        isClosable: true,
                                    });
                                });
                        }}
                    >
                        Provisionar
                    </Button>
                </Wrap>
            </CardFooter>
        </Card>
    );
};
