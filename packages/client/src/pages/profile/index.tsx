import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Box, Button, Container, Heading, Stack, Text, VStack } from '@chakra-ui/react';
import { FiSave } from 'react-icons/fi';
import { ProfileQuotaCard } from './quota-card';
import { ProfileInfoCard } from './info-card';
import { ProfileGroupsCard } from './groups-card';

export const ProfilePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();

    useEffect(() => {
        setActiveMenuItem(undefined);
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
                        <Heading color='gray.800'>Meu Perfil</Heading>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {`Membro desde ${new Date().toLocaleDateString()}`}
                        </Text>
                    </VStack>

                    <Button
                        variant={'solid'}
                        colorScheme='blue'
                        leftIcon={<FiSave />}
                    >
                        Salvar
                    </Button>
                </Stack>

                <ProfileInfoCard />
                <ProfileQuotaCard />
                <ProfileGroupsCard />
            </Container>
        </Box>
    );
};
