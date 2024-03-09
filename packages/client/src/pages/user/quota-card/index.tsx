import {
    Box,
    Card,
    CardBody,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Icon,
    InputGroup,
    InputRightElement,
    Link,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    SimpleGrid,
    Spinner,
    VStack,
    useDisclosure,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useUser } from '../../../hooks/use-user';
import { useUserOperations } from '../../../hooks/use-user-operations';
import { getErrorMessage } from '../../../services/helpers';
import { UserPageQuotaCardInstanceTypeCard } from './instance-type-card';
import { FiPlus } from 'react-icons/fi';
import { UserPageQuotaCardAddInstanceTypeModal } from './add-instance-type-modal';

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
    const addInstanceTypeModalDisclosure = useDisclosure();

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
            <UserPageQuotaCardAddInstanceTypeModal
                userInstanceTypes={userQuery.data?.quotas.allowedInstanceTypes ?? []}
                isOpen={addInstanceTypeModalDisclosure.isOpen}
                onClose={addInstanceTypeModalDisclosure.onClose}
            />

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
                        <SimpleGrid
                            columns={{ base: 1, md: 2 }}
                            spacing={4}
                            w={'full'}
                            my={4}
                            hidden={userQuery.isLoading}
                        >
                            <Card
                                w={'full'}
                                borderRadius={12}
                                boxShadow={'lg'}
                                borderColor={'gray.200'}
                                bgColor={'gray.100'}
                                borderWidth={2}
                                _hover={{
                                    borderColor: 'gray.500',
                                    cursor: 'pointer',
                                }}
                                onClick={addInstanceTypeModalDisclosure.onOpen}
                            >
                                <CardBody>
                                    <Box
                                        w={'full'}
                                        h={'full'}
                                        display={'flex'}
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                    >
                                        <Icon
                                            as={FiPlus}
                                            boxSize={'100px'}
                                            color={'gray.500'}
                                        />
                                    </Box>
                                </CardBody>
                            </Card>

                            {userQuery.data?.quotas.allowedInstanceTypes.map(
                                (instanceType, index) => (
                                    <UserPageQuotaCardInstanceTypeCard
                                        key={`user-page-quota-card-instance-type-card-${instanceType.name}-${index}`}
                                        onRemove={() => {
                                            console.log('remove');
                                        }}
                                        instanceType={instanceType}
                                    />
                                ),
                            )}
                        </SimpleGrid>

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
