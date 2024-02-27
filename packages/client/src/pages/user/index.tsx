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
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';

export const UserPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();

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
                    <SlideFade
                        in
                        offsetX={'-20px'}
                        offsetY={0}
                    >
                        <VStack
                            spacing={0}
                            align={{ base: 'center', md: 'initial' }}
                        >
                            <Breadcrumb separator={<Heading>/</Heading>}>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href='/admin/users'>
                                        <Heading color='gray.800'>Usuários</Heading>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>

                                <BreadcrumbItem>
                                    <BreadcrumbLink isCurrentPage>
                                        <Heading color='gray.800'>TODO</Heading>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </Breadcrumb>
                        </VStack>
                    </SlideFade>

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
                                    // hidden={usersQuery.isLoading}
                                    // isLoading={usersQuery.isFetching}
                                    // onClick={() => {
                                    //     usersQuery.refetch().catch(console.error);
                                    // }}
                                >
                                    <FiRefreshCw />
                                </IconButton>
                            </Tooltip>
                        </ButtonGroup>
                    </SlideFade>
                </Stack>
            </Container>
        </Box>
    );
};
