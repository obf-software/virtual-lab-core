import { Box, Container, Heading, VStack, Text, Button, Stack } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import React, { useEffect } from 'react';
import { InstanceCard } from './instance-card';
import { useMenuContext } from '../../contexts/menu/hook';
import { useInstancesContext } from '../../contexts/instances/hook';
import { Paginator } from '../../components/paginator';

const RESULTS_PER_PAGE = 20;
const MILLISECONDS_BETWEEN_AUTO_LOADS = 900000;

export const InstancesPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const {
        numberOfResults,
        lastLoadAt,
        loadInstancesPage,
        instances,
        isLoading,
        numberOfPages,
        activePage,
    } = useInstancesContext();

    useEffect(() => {
        setActiveMenuItem('INSTANCES');

        if (
            (lastLoadAt === undefined ||
                new Date().getTime() - lastLoadAt.getTime() > MILLISECONDS_BETWEEN_AUTO_LOADS) &&
            isLoading === false
        ) {
            loadInstancesPage(1, RESULTS_PER_PAGE).catch(console.error);
        }
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
                        <Heading color='gray.800'>Instâncias</Heading>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {`${numberOfResults} instâncias encontradas`}
                        </Text>
                    </VStack>

                    <Button
                        variant={'solid'}
                        colorScheme='blue'
                        leftIcon={<FiPlus />}
                        isLoading={isLoading}
                    >
                        Nova instância
                    </Button>
                </Stack>

                {instances.length === 0 ? (
                    <Box>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            Nenhuma instância encontrada
                        </Text>
                    </Box>
                ) : null}

                {instances.map((instance) => (
                    <Box
                        pb={10}
                        key={`instance-${instance.awsInstanceId}`}
                    >
                        <InstanceCard instance={instance} />
                    </Box>
                ))}

                <Paginator
                    activePage={activePage}
                    totalPages={numberOfPages}
                    onPageChange={(page) => {
                        loadInstancesPage(page, RESULTS_PER_PAGE).catch(console.error);
                    }}
                />
            </Container>
        </Box>
    );
};
