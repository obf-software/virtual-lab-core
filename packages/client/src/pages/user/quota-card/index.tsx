import {
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    InputGroup,
    InputRightElement,
    Link,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    Spinner,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useUser } from '../../../hooks/use-user';
import { useUserOperations } from '../../../hooks/use-user-operations';
import { getErrorMessage } from '../../../services/helpers';

interface UserPageQuotaCardProps {
    userQuery: ReturnType<typeof useUser>['userQuery'];
}

export const UserPageQuotaCard: React.FC<UserPageQuotaCardProps> = ({ userQuery }) => {
    const { updateQuotas } = useUserOperations();
    const toast = useToast();
    const [maxInstances, setMaxInstances] = React.useState<number>(
        userQuery.data?.quotas.maxInstances ?? 0,
    );
    const [debouncedMaxInstances, setDebouncedMaxInstances] = React.useState<number>();

    React.useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedMaxInstances(maxInstances);
        }, 1000);

        return () => {
            clearTimeout(timeout);
        };
    }, [maxInstances]);

    React.useEffect(() => {
        if (
            debouncedMaxInstances !== undefined &&
            debouncedMaxInstances !== userQuery.data?.quotas.maxInstances &&
            debouncedMaxInstances >= 0
        ) {
            updateQuotas.mutate(
                {
                    userId: userQuery.data?.id ?? '',
                    maxInstances: debouncedMaxInstances,
                },
                {
                    onError: (error) => {
                        toast({
                            title: 'Erro ao atualizar número de instâncias simultâneas',
                            description: getErrorMessage(error),
                            status: 'error',
                        });
                    },
                },
            );
        }
    }, [debouncedMaxInstances]);

    React.useEffect(() => {
        setMaxInstances(userQuery.data?.quotas.maxInstances ?? 0);
    }, [userQuery.data?.quotas.maxInstances]);

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
                <FormControl>
                    <FormLabel fontWeight={'bold'}>Número de instâncias simultâneas</FormLabel>
                    <InputGroup>
                        <NumberInput
                            width={'100%'}
                            value={maxInstances}
                            min={0}
                            onChange={(valueString) => {
                                const value = parseInt(valueString);

                                if (Number.isNaN(value)) {
                                    setMaxInstances(0);
                                    return;
                                }

                                setMaxInstances(value);
                            }}
                        >
                            <NumberInputField />
                            <NumberInputStepper
                                hidden={userQuery.isLoading || updateQuotas.isPending}
                            >
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>

                        {(userQuery.isLoading || updateQuotas.isPending) && (
                            <InputRightElement>
                                <Spinner size='sm' />
                            </InputRightElement>
                        )}
                    </InputGroup>
                    <FormHelperText>
                        O número máximo de instâncias que o usuário pode ter rodando
                        simultaneamente.
                    </FormHelperText>
                </FormControl>

                <FormControl
                    mt={'2%'}
                    isReadOnly
                >
                    <FormLabel fontWeight={'bold'}>Pode criar instâncias com hibernação?</FormLabel>
                    <InputGroup>
                        <Select
                            isDisabled={userQuery.isLoading || updateQuotas.isPending}
                            value={
                                userQuery.data?.quotas.canLaunchInstanceWithHibernation !==
                                undefined
                                    ? userQuery.data?.quotas.canLaunchInstanceWithHibernation
                                        ? 'true'
                                        : 'false'
                                    : '-'
                            }
                            onChange={(e) => {
                                updateQuotas.mutate({
                                    userId: userQuery.data?.id ?? '',
                                    canLaunchInstanceWithHibernation: e.target.value === 'true',
                                });
                            }}
                        >
                            <option value='true'>Sim</option>
                            <option value='false'>Não</option>
                        </Select>
                        {/* <Input
                            value={
                                userQuery.data?.quotas.canLaunchInstanceWithHibernation !==
                                undefined
                                    ? userQuery.data?.quotas.canLaunchInstanceWithHibernation
                                        ? 'Sim'
                                        : 'Não'
                                    : '-'
                            }
                        /> */}
                        {(userQuery.isLoading || updateQuotas.isPending) && (
                            <InputRightElement>
                                <Spinner
                                    size='sm'
                                    hidden={!userQuery.isLoading}
                                />
                            </InputRightElement>
                        )}
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
                        Os tipos de instâncias que o usuário pode criar. Para mais informações,{' '}
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
