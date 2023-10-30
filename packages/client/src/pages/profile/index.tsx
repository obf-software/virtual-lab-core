import 'dayjs/locale/pt-br';
import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Box, Button, Container, Heading, Stack, Text, VStack, useToast } from '@chakra-ui/react';
import { FiSave } from 'react-icons/fi';
import { ProfileQuotaCard } from './quota-card';
import { ProfileInfoCard } from './info-card';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { parseSessionData } from '../../services/helpers';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useUser } from '../../hooks/user';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export const ProfilePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const { user } = useAuthenticator((context) => [context.user]);
    const { name } = parseSessionData(user);
    const [currentName, setCurrentName] = React.useState<string>(name ?? '');
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const useUserQuery = useUser('me');
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
                                useUserQuery.data?.createdAt !== undefined
                                    ? dayjs(useUserQuery.data?.createdAt).format('DD/MM/YYYY')
                                    : 'muito tempo'
                            }`}
                        </Text>
                    </VStack>

                    <Button
                        variant={'solid'}
                        colorScheme='blue'
                        leftIcon={<FiSave />}
                        isLoading={isLoading}
                        isDisabled={name === currentName}
                        onClick={() => {
                            if (name === currentName) {
                                return;
                            }

                            setIsLoading(true);

                            user.updateAttributes(
                                [{ Name: 'name', Value: currentName }],
                                (error) => {
                                    setIsLoading(false);

                                    if (error) {
                                        toast({
                                            title: 'Erro ao atualizar perfil!',
                                            status: 'error',
                                            duration: 3000,
                                            colorScheme: 'red',
                                            variant: 'left-accent',
                                            description: `${error.message}`,
                                            position: 'bottom-left',
                                        });
                                    } else {
                                        toast({
                                            title: 'Perfil atualizado com sucesso!',
                                            status: 'success',
                                            duration: 3000,
                                            colorScheme: 'green',
                                            variant: 'left-accent',
                                            position: 'top',
                                        });
                                    }
                                },
                            );
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
