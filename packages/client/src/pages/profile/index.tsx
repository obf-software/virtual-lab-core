import 'dayjs/locale/pt-br';
import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Box, Button, Container, Heading, Stack, Text, VStack, useToast } from '@chakra-ui/react';
import { FiSave } from 'react-icons/fi';
import { ProfileQuotaCard } from './quota-card';
import { ProfileInfoCard } from './info-card';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useUser } from '../../hooks/use-user';
import { useAuthSessionData } from '../../hooks/use-auth-session-data';
import { updateUserAttributes } from 'aws-amplify/auth';
import { getErrorMessage } from '../../services/helpers';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export const ProfilePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const authSessionData = useAuthSessionData();
    const [currentName, setCurrentName] = React.useState<string>(authSessionData?.name ?? '');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const { userQuery } = useUser({ userId: 'me' });
    const toast = useToast();

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
                            {`Membro desde ${
                                userQuery.data !== undefined
                                    ? dayjs(userQuery.data.createdAt).format('DD/MM/YYYY')
                                    : 'muito tempo'
                            }`}
                        </Text>
                    </VStack>

                    <Button
                        variant={'solid'}
                        colorScheme='blue'
                        leftIcon={<FiSave />}
                        isLoading={isLoading}
                        isDisabled={authSessionData?.name === currentName}
                        onClick={() => {
                            if (authSessionData?.name === currentName) {
                                return;
                            }

                            setIsLoading(true);

                            updateUserAttributes({
                                userAttributes: {
                                    name: currentName,
                                },
                            })
                                .then(() => {
                                    setIsLoading(false);

                                    toast({
                                        title: 'Perfil atualizado com sucesso!',
                                        status: 'success',
                                        duration: 3000,
                                        colorScheme: 'green',
                                        variant: 'left-accent',
                                        position: 'top',
                                    });
                                })
                                .catch((error) => {
                                    setIsLoading(false);
                                    return toast({
                                        title: 'Erro ao atualizar perfil!',
                                        status: 'error',
                                        duration: 3000,
                                        colorScheme: 'red',
                                        variant: 'left-accent',
                                        description: `${getErrorMessage(error)}`,
                                        position: 'bottom-left',
                                    });
                                });
                        }}
                    >
                        Salvar
                    </Button>
                </Stack>

                <ProfileInfoCard
                    currentName={currentName}
                    onCurrentNameChange={(newName) => setCurrentName(newName)}
                />
                <ProfileQuotaCard />
            </Container>
        </Box>
    );
};
