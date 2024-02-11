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
    Tooltip,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { NewInstanceCard } from './card';
import { useUserProducts } from '../../hooks/use-instance-templates';

export const NewInstancePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const { products, numberOfProducts, isFetching, isLoading, refetch } = useUserProducts({
        userId: 'me',
    });

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
                        <Tooltip label='Recarregar'>
                            <IconButton
                                aria-label='Recarregar'
                                variant={'outline'}
                                colorScheme='blue'
                                hidden={isLoading}
                                isLoading={isFetching}
                                onClick={refetch}
                            >
                                <FiRefreshCw />
                            </IconButton>
                        </Tooltip>
                    </ButtonGroup>
                </Stack>

                {numberOfProducts === 0 && !isLoading ? (
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

                {products.map((product) => (
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
