import {
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    Spinner,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useUser } from '../../../hooks/use-user';
import { getErrorMessage } from '../../../services/helpers';

export const ProfilePageQuotaCard: React.FC = () => {
    const toast = useToast();
    const { userQuery } = useUser({ userId: 'me' });

    if (userQuery.isError) {
        toast({
            title: 'Erro ao carregar usuário!',
            status: 'error',
            duration: 3000,
            colorScheme: 'red',
            variant: 'left-accent',
            description: getErrorMessage(userQuery.error),
            position: 'bottom-left',
        });
    }

    return (
        <VStack
            spacing={4}
            align={'start'}
        >
            <Heading
                size={'lg'}
                color='gray.800'
            >
                Cotas de uso
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
                    <FormLabel fontWeight={'bold'}>Número de instâncias simultâneas</FormLabel>
                    <InputGroup>
                        <Input value={userQuery.data?.quotas.maxInstances ?? '-'} />
                        <InputRightElement>
                            <Spinner
                                size='sm'
                                hidden={!userQuery.isLoading}
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormHelperText>
                        O número máximo de instâncias que você pode ter rodando simultaneamente.
                    </FormHelperText>
                </FormControl>

                <FormControl
                    mt={'2%'}
                    isReadOnly
                >
                    <FormLabel fontWeight={'bold'}>Pode criar instâncias com hibernação?</FormLabel>
                    <InputGroup>
                        <Input
                            value={
                                userQuery.data?.quotas.canLaunchInstanceWithHibernation !==
                                undefined
                                    ? userQuery.data?.quotas.canLaunchInstanceWithHibernation
                                        ? 'Sim'
                                        : 'Não'
                                    : '-'
                            }
                        />
                        <InputRightElement>
                            <Spinner
                                size='sm'
                                hidden={!userQuery.isLoading}
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormHelperText>
                        A hibernação possibilita desligar a instância mantendo o estado de execução.
                        Ao ligar a instância, a execução continua de onde parou.
                    </FormHelperText>
                </FormControl>

                <FormControl
                    mt={'2%'}
                    isReadOnly
                >
                    <FormLabel fontWeight={'bold'}>Tipos de instâncias permitidos</FormLabel>
                    <InputGroup>
                        <Textarea
                            value={
                                userQuery.data?.quotas.allowedInstanceTypes !== undefined
                                    ? userQuery.data?.quotas.allowedInstanceTypes.join('\n')
                                    : '-'
                            }
                            overflow={'visible'}
                        />
                        <InputRightElement>
                            <Spinner
                                size='sm'
                                hidden={!userQuery.isLoading}
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormHelperText>
                        Os tipos de instâncias que você pode criar. Para mais informações,{' '}
                        <Link
                            isExternal
                            href={
                                'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/instance-types.html'
                            }
                            color={'blue.500'}
                        >
                            clique aqui
                        </Link>
                        .
                    </FormHelperText>
                </FormControl>
            </Box>
        </VStack>
    );
};
