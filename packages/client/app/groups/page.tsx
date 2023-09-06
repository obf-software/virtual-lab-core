'use client';

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
} from '@chakra-ui/react';
import { GroupsTable } from './_components/groups-table';
import { FiChevronsDown, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { useMenu } from '@/contexts/menu';
import { useEffect } from 'react';

export default function Users() {
    const { setActiveMenuItem } = useMenu();

    useEffect(() => {
        setActiveMenuItem('GROUPS');
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
                        <Heading color='gray.800'>Grupos</Heading>
                        <Text
                            fontSize='md'
                            color='gray.600'
                        >
                            {`${count} grupos encontrados`}
                        </Text>
                    </VStack>

                    <Button
                        variant={'solid'}
                        colorScheme='blue'
                        leftIcon={<FiPlus />}
                    >
                        Adicionar grupo
                    </Button>
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
                        />
                        <InputRightElement>
                            <IconButton
                                aria-label='Limpar pesquisa'
                                variant={'ghost'}
                                size={'sm'}
                                icon={<FiX />}
                            />
                        </InputRightElement>
                    </InputGroup>
                </Stack>

                <GroupsTable />

                <Box pt={5}>
                    <Button
                        variant={'outline'}
                        colorScheme='blue'
                        leftIcon={<FiChevronsDown />}
                        isDisabled={false}
                    >
                        Carregar mais
                    </Button>
                </Box>
            </Container>
        </Box>
    );
}
