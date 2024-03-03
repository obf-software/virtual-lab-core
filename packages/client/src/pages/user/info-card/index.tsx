import {
    Box,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Select,
    Spinner,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { getErrorMessage, roleToDisplayString } from '../../../services/helpers';
import { useUser } from '../../../hooks/use-user';
import { useUserOperations } from '../../../hooks/use-user-operations';
import { Role } from '../../../services/api-protocols';
import dayjs from 'dayjs';

interface UserPageInfoCardProps {
    userQuery: ReturnType<typeof useUser>['userQuery'];
}

export const UserPageInfoCard: React.FC<UserPageInfoCardProps> = ({ userQuery }) => {
    const { updateRole } = useUserOperations();
    const toast = useToast();

    return (
        <VStack
            spacing={4}
            align={'start'}
        >
            <Heading
                size={'lg'}
                color='gray.800'
            >
                Informações
            </Heading>

            <Box
                w={'full'}
                bgColor={'white'}
                px={4}
                py={8}
                borderRadius={12}
                boxShadow={'md'}
            >
                <FormControl isReadOnly>
                    <FormLabel
                        id='id'
                        fontWeight={'bold'}
                    >
                        Id
                    </FormLabel>
                    <InputGroup>
                        <Input
                            id='name'
                            type='text'
                            value={userQuery.data?.id ?? '-'}
                        />
                        <InputRightElement>
                            {userQuery.isLoading && (
                                <Spinner
                                    size='sm'
                                    color='gray.500'
                                />
                            )}
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <Flex mt={'2%'}>
                    <FormControl
                        mr='2%'
                        isReadOnly
                    >
                        <FormLabel
                            id='username'
                            fontWeight={'bold'}
                        >
                            Usuário
                        </FormLabel>

                        <InputGroup>
                            <Input
                                id='username'
                                type='text'
                                value={
                                    userQuery.data?.preferredUsername ?? userQuery.data?.username
                                }
                            />
                            <InputRightElement>
                                {userQuery.isLoading && (
                                    <Spinner
                                        size='sm'
                                        color='gray.500'
                                    />
                                )}
                            </InputRightElement>
                        </InputGroup>
                    </FormControl>

                    <FormControl isReadOnly>
                        <FormLabel
                            id='role'
                            fontWeight={'bold'}
                        >
                            Cargo
                        </FormLabel>

                        <Select
                            id='role'
                            isDisabled={updateRole.isPending || userQuery.isFetching}
                            value={userQuery.data?.role}
                            onChange={(e) => {
                                updateRole.mutate(
                                    {
                                        userId: userQuery.data?.id ?? '',
                                        role: e.target.value as Role,
                                    },
                                    {
                                        onError: (error) => {
                                            toast({
                                                title: 'Erro ao atualizar o cargo',
                                                description: getErrorMessage(error),
                                                status: 'error',
                                                duration: 5000,
                                                isClosable: true,
                                            });
                                        },
                                    },
                                );
                            }}
                        >
                            <option
                                value='PENDING'
                                disabled
                                selected={userQuery.data?.role === 'PENDING'}
                            >
                                {roleToDisplayString('PENDING')}
                            </option>

                            <option
                                value='NONE'
                                selected={userQuery.data?.role === 'NONE'}
                            >
                                {roleToDisplayString('NONE')}
                            </option>

                            <option
                                value='USER'
                                selected={userQuery.data?.role === 'USER'}
                            >
                                {roleToDisplayString('USER')}
                            </option>

                            <option
                                value='ADMIN'
                                selected={userQuery.data?.role === 'ADMIN'}
                            >
                                {roleToDisplayString('ADMIN')}
                            </option>
                        </Select>
                    </FormControl>
                </Flex>

                <FormControl
                    mt={'2%'}
                    isReadOnly
                >
                    <FormLabel
                        id='name'
                        fontWeight={'bold'}
                    >
                        Nome
                    </FormLabel>
                    <InputGroup>
                        <Input
                            id='name'
                            type='text'
                            value={userQuery.data?.name ?? '-'}
                        />
                        <InputRightElement>
                            {userQuery.isLoading && (
                                <Spinner
                                    size='sm'
                                    color='gray.500'
                                />
                            )}
                        </InputRightElement>
                    </InputGroup>
                </FormControl>

                <FormControl
                    mt={'2%'}
                    isReadOnly
                >
                    <FormLabel
                        id='name'
                        fontWeight={'bold'}
                    >
                        Data de último login
                    </FormLabel>
                    <InputGroup>
                        <Input
                            id='last-login-at'
                            type='text'
                            value={
                                userQuery.data?.lastLoginAt !== undefined
                                    ? dayjs(userQuery.data?.lastLoginAt).format('DD/MM/YYYY HH:mm')
                                    : 'Nunca'
                            }
                        />
                        <InputRightElement>
                            {userQuery.isLoading && (
                                <Spinner
                                    size='sm'
                                    color='gray.500'
                                />
                            )}
                        </InputRightElement>
                    </InputGroup>
                </FormControl>
            </Box>
        </VStack>
    );
};
