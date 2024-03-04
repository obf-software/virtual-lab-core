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
    SimpleGrid,
    Spinner,
    Text,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useUser } from '../../../hooks/use-user';
import { getErrorMessage } from '../../../services/helpers';
import { ProfilePageQuotaCardInstanceTypeCard } from './instance-type-card';

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
                        <SimpleGrid
                            columns={{ base: 1, md: 2 }}
                            spacing={4}
                            w={'full'}
                            my={4}
                        >
                            {userQuery.data?.quotas.allowedInstanceTypes.map(
                                (instanceType, index) => (
                                    <ProfilePageQuotaCardInstanceTypeCard
                                        key={`profile-page-quota-card-instance-type-card-${instanceType.name}-${index}`}
                                        instanceType={instanceType}
                                    />
                                ),
                            )}
                        </SimpleGrid>

                        {userQuery.data?.quotas.allowedInstanceTypes.length === 0 &&
                            !userQuery.isLoading && (
                                <Box
                                    py={4}
                                    w={'full'}
                                    textAlign={'center'}
                                >
                                    <Text textColor={'gray.500'}>
                                        Nenhum tipo de instância permitido
                                    </Text>
                                </Box>
                            )}

                        {userQuery.isLoading && (
                            <Box
                                py={4}
                                w={'full'}
                                textAlign={'center'}
                            >
                                <Spinner size='md' />
                            </Box>
                        )}
                    </InputGroup>
                    <FormHelperText>
                        Os tipos de instâncias que você pode criar. Para mais informações,{' '}
                        <Link
                            isExternal
                            href={'https://aws.amazon.com/pt/ec2/instance-types/'}
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
