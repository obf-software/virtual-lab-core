import {
    Box,
    Container,
    Heading,
    VStack,
    Text,
    Button,
    Stack,
    InputGroup,
    Input,
    InputLeftElement,
    InputRightElement,
    IconButton,
    ButtonGroup,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import { FiPlus, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import React from 'react';
import { useMenuContext } from '../../contexts/menu/hook';
import { Paginator } from '../../components/paginator';
import { CreateGroupModal } from './create-group-modal';
import { useSearchParams } from 'react-router-dom';
import { useGroups } from '../../hooks/groups';
import { GroupsTable } from '../../components/groups-table';
import { ConfirmDeletionModal } from '../../components/confirm-deletion-modal';

export const GroupsPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const { groupsQuery } = useGroups({ resultsPerPage: 20, page });
    const { setActiveMenuItem } = useMenuContext(); // TODO: Convert context to zustand hook.
    const groupDetailsModalDisclosure = useDisclosure();
    const toast = useToast();

    const createGroupModalDisclosure = useDisclosure();

    React.useEffect(() => {
        if (groupsQuery.data?.numberOfPages && page > groupsQuery.data?.numberOfPages) {
            setSearchParams((prev) => {
                prev.set('page', '1');
                return prev;
            });
        } else {
            setSearchParams((prev) => {
                prev.set('page', page.toString());
                return prev;
            });
        }

        setActiveMenuItem('ADMIN_GROUPS');
    }, [page, groupsQuery.data?.numberOfPages]);

    const numberOfGroups = groupsQuery.data?.numberOfResults ?? 0;

    return (
        <Box>
            <CreateGroupModal
                isOpen={createGroupModalDisclosure.isOpen}
                onClose={createGroupModalDisclosure.onClose}
            />

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
                        <Heading color='gray.800'>Grupos</Heading>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {numberOfGroups === 0 ? 'Nenhum grupo encontrado' : null}
                            {numberOfGroups === 1 ? `${numberOfGroups} grupo encontrado` : null}
                            {numberOfGroups > 1 ? `${numberOfGroups} grupos encontrados` : null}
                        </Text>
                    </VStack>

                    <ButtonGroup>
                        <IconButton
                            aria-label='Recarregar'
                            variant={'outline'}
                            colorScheme='blue'
                            isLoading={groupsQuery.isLoading}
                            onClick={() => {
                                groupsQuery.refetch().catch(console.error);
                            }}
                        >
                            <FiRefreshCw />
                        </IconButton>

                        <Button
                            variant={'solid'}
                            colorScheme='blue'
                            leftIcon={<FiPlus />}
                            onClick={createGroupModalDisclosure.onOpen}
                        >
                            Novo grupo
                        </Button>
                    </ButtonGroup>
                </Stack>

                <Stack pb={5}>
                    <InputGroup boxShadow={'sm'}>
                        <InputLeftElement pointerEvents='none'>
                            <FiSearch color='gray.300' />
                        </InputLeftElement>
                        <Input
                            type='text'
                            placeholder='Pesquisar'
                            bgColor={'white'}
                            disabled
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label='Limpar pesquisa'
                                variant={'ghost'}
                                size={'sm'}
                                icon={<FiX />}
                                isDisabled
                            />
                        </InputRightElement>
                    </InputGroup>
                </Stack>

                <GroupsTable
                    groups={groupsQuery.data?.data ?? []}
                    isLoading={groupsQuery.isLoading}
                    onSelect={(group) => {
                        toast({
                            title: 'TODO: Abrir grupo',
                            description: `Abrir grupo ${group.name}`,
                            status: 'info',
                            duration: 3000,
                            isClosable: true,
                        });
                    }}
                    onDelete={(group) => {
                        console.log(group);
                    }}
                />

                <Paginator
                    activePage={page}
                    totalPages={groupsQuery.data?.numberOfPages ?? 0}
                    onPageChange={(selectedPage) => {
                        setSearchParams((prev) => {
                            prev.set('page', selectedPage.toString());
                            return prev;
                        });
                    }}
                />
            </Container>
        </Box>
    );
};
