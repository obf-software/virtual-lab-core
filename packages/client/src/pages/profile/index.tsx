import 'dayjs/locale/pt-br';
import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import {
    Box,
    Container,
    Fade,
    Heading,
    IconButton,
    SlideFade,
    Stack,
    Text,
    Tooltip,
    VStack,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import { ProfileQuotaCard } from './quota-card';
import { ProfilePageInfoCard } from './info-card';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useUser } from '../../hooks/use-user';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

export const ProfilePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const { userQuery } = useUser({ userId: 'me' });

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
                    <SlideFade
                        in
                        offsetX={-20}
                        offsetY={0}
                    >
                        <VStack
                            spacing={0}
                            align={{ base: 'center', md: 'initial' }}
                        >
                            <Heading color='gray.800'>Meu Perfil</Heading>
                            <Fade in={userQuery.data !== undefined}>
                                <Text
                                    fontSize='md'
                                    color='gray.600'
                                >
                                    {`Membro desde ${dayjs(userQuery.data?.createdAt).format(
                                        'DD/MM/YYYY',
                                    )}`}
                                </Text>
                            </Fade>
                        </VStack>
                    </SlideFade>

                    <SlideFade
                        in
                        offsetX={20}
                        offsetY={0}
                    >
                        <Tooltip label='Recarregar'>
                            <IconButton
                                aria-label='Recarregar'
                                variant={'outline'}
                                colorScheme='blue'
                                isLoading={userQuery.isFetching}
                                onClick={() => {
                                    userQuery.refetch().catch(console.error);
                                }}
                            >
                                <FiRefreshCw />
                            </IconButton>
                        </Tooltip>
                    </SlideFade>
                </Stack>

                <Stack
                    direction={'column'}
                    spacing={6}
                >
                    <ProfilePageInfoCard />
                    <ProfileQuotaCard />
                </Stack>
            </Container>
        </Box>
    );
};
