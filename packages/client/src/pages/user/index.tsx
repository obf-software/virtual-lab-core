import {
    Box,
    Container,
    Heading,
    VStack,
    Stack,
    IconButton,
    Tooltip,
    SlideFade,
    ButtonGroup,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Fade,
    Text,
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../../hooks/use-user';
import { UserPageInfoCard } from './info-card';
import dayjs from 'dayjs';
import { UserPageQuotaCard } from './quota-card';

export const UserPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();
    const navigate = useNavigate();
    const params = useParams();
    const { userQuery } = useUser({ userId: params.userId! });

    React.useEffect(() => {
        setActiveMenuItem('ADMIN_USERS');
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
                        <Breadcrumb separator={<Heading>/</Heading>}>
                            <BreadcrumbItem>
                                <BreadcrumbLink
                                    onClick={() => {
                                        navigate('/admin/users');
                                    }}
                                >
                                    <Heading color='gray.800'>Usuários</Heading>
                                </BreadcrumbLink>
                            </BreadcrumbItem>

                            <SlideFade
                                in
                                offsetX={'-20px'}
                                offsetY={0}
                            >
                                <BreadcrumbItem>
                                    <BreadcrumbLink isCurrentPage>
                                        <Heading color='gray.800'>
                                            {userQuery.data?.name ??
                                                userQuery.data?.preferredUsername ??
                                                userQuery.data?.username}
                                        </Heading>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </SlideFade>
                        </Breadcrumb>

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

                    <SlideFade
                        in
                        offsetX={'20px'}
                        offsetY={0}
                    >
                        <ButtonGroup>
                            <Tooltip label='Recarregar'>
                                <IconButton
                                    aria-label='Recarregar'
                                    variant={'outline'}
                                    colorScheme='blue'
                                    hidden={userQuery.isLoading}
                                    isLoading={userQuery.isFetching}
                                    onClick={() => {
                                        userQuery.refetch().catch(console.error);
                                    }}
                                >
                                    <FiRefreshCw />
                                </IconButton>
                            </Tooltip>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>

                <Stack
                    direction={'column'}
                    spacing={6}
                >
                    <UserPageInfoCard userQuery={userQuery} />
                    <UserPageQuotaCard userQuery={userQuery} />
                </Stack>
            </Container>
        </Box>
    );
};
