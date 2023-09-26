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
import { useProductsContext } from '../../contexts/products/hook';

export const NewInstancePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const { isLoading, products, loadProducts } = useProductsContext();

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
                            {`${products.length === 0 ? 'Nenhum' : products.length} ${
                                products.length > 1 ? 'produtos disponíveis' : 'produto disponível'
                            }`}
                        </Text>
                    </VStack>

                    <ButtonGroup>
                        <IconButton
                            aria-label='Recarregar'
                            variant={'outline'}
                            colorScheme='blue'
                            isLoading={isLoading}
                            onClick={() => {
                                loadProducts().catch(console.error);
                            }}
                        >
                            <FiRefreshCw />
                        </IconButton>
                    </ButtonGroup>
                </Stack>

                {products.length === 0 && !isLoading ? (
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
                            Nenhuma instância encontrada
                        </Text>
                    </Box>
                ) : null}

                {isLoading ? (
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
            </Container>
        </Box>
    );
};
