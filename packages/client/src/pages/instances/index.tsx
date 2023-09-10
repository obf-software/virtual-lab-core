import { Box, Container, Heading, VStack, Text, Button, Stack } from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import React, { useEffect } from 'react';
import { InstanceCard } from './instance-card';
import { useMenuContext } from '../../contexts/menu/hook';

export const InstancesPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();

    useEffect(() => {
        setActiveMenuItem('INSTANCES');
    }, []);

    const count = 10;
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
                            {`${count} instâncias encontradas`}
                        </Text>
                    </VStack>

                    <Button
                        variant={'solid'}
                        colorScheme='blue'
                        leftIcon={<FiPlus />}
                    >
                        Nova instância
                    </Button>
                </Stack>

                <Box pb={10}>
                    <InstanceCard status='ATIVA' />
                </Box>
                <Box pb={10}>
                    <InstanceCard status='DESLIGADA' />
                </Box>
                <Box pb={10}>
                    <InstanceCard status='DESLIGANDO' />
                </Box>
                <Box pb={10}>
                    <InstanceCard status='EXCLUIDA' />
                </Box>
                <Box pb={10}>
                    <InstanceCard status='EXCLUINDO' />
                </Box>
                <Box pb={10}>
                    <InstanceCard status='PENDENTE' />
                </Box>
            </Container>
        </Box>
    );
};
