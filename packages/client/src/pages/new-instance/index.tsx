import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Stack,
    ButtonGroup,
    IconButton,
    Spinner,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { NewInstanceCard } from './card';
import { useQuery } from '@tanstack/react-query';
import * as api from '../../services/api/service';

export const NewInstancePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();

    const productsQuery = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data, error } = await api.listUserProducts('me');
            if (error !== undefined) throw new Error(error);
            return data;
        },
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const numberOfProducts = productsQuery.data?.length ?? 0;

    useEffect(() => {
        setActiveMenuItem('INSTANCES');
    }, []);

    return (
        <Box>
            <Container maxW={'6xl'}>
                <Stack
                    pb={10}
                    maxW={'6xl'}
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: 'center', md: 'space-between' }}
                    align={{ base: 'center', md: 'center' }}
                    spacing={{ base: 5, md: 10 }}
                >
                    <VStack
                        spacing={0}
                        align={{ base: 'center', md: 'initial' }}
                    >
                        <Heading color='gray.800'>Nova Instância</Heading>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {numberOfProducts === 0 ? 'Nenhum produto disponível' : null}
                            {numberOfProducts === 1 ? '1 produto disponível' : null}
                            {numberOfProducts > 1 ? 'Produtos disponíveis' : null}
                        </Text>
                    </VStack>

                    <ButtonGroup>
                        <IconButton
                            aria-label='Recarregar'
                            variant={'outline'}
                            colorScheme='blue'
                            hidden={productsQuery.isLoading}
                            isLoading={productsQuery.isFetching}
                            onClick={() => {
                                productsQuery.refetch().catch(console.error);
                            }}
                        >
                            <FiRefreshCw />
                        </IconButton>
                    </ButtonGroup>
                </Stack>

                {numberOfProducts === 0 && !productsQuery.isLoading ? (
                    <Box
                        height={'50vh'}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <Text
                            align={'center'}
                            fontSize='xl'
                            color='gray.600'
                        >
                            Nenhum produto encontrado
                        </Text>
                    </Box>
                ) : null}

                {productsQuery.isLoading ? (
                    <Box
                        height={'50vh'}
                        display={'flex'}
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <Spinner
                            size={'xl'}
                            speed={'1s'}
                            thickness={'4px'}
                            color={'blue.500'}
                            emptyColor={'gray.200'}
                        />
                    </Box>
                ) : null}

                {productsQuery.data?.map((product) => (
                    <Box
                        pb={10}
                        key={`product-${product.id}`}
                    >
                        <NewInstanceCard product={product} />
                    </Box>
                ))}
            </Container>
        </Box>
    );
};
