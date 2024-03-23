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
import { UserPageQuotaCardAddInstanceTypeModal } from './add-instance-type-modal';
import { ConfirmDeletionAlertDialog } from '../../../components/confirm-deletion-alert-dialog';

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

    const [instanceTypeToRemove, setInstanceTypeToRemove] = React.useState<string | undefined>();
    const removeInstanceTypeModalDisclosure = useDisclosure();

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

            <ConfirmDeletionAlertDialog
                isLoading={updateQuotas.isPending}
                isOpen={removeInstanceTypeModalDisclosure.isOpen}
                onClose={removeInstanceTypeModalDisclosure.onClose}
                title={`Remover tipo de instância ${instanceTypeToRemove ?? ''}?`}
                text={`O usuário não poderá mais criar instâncias desse tipo.`}
                onConfirm={() => {
                    if (userQuery.data === undefined) {
                        return;
                    }

                    updateQuotas.mutate(
                        {
                            userId: userQuery.data.id,
                            allowedInstanceTypes: [
                                ...new Set(
                                    userQuery.data.quotas.allowedInstanceTypes
                                        .filter(
                                            (instanceType) =>
                                                instanceType.name !== instanceTypeToRemove,
                                        )
                                        .map((instanceType) => instanceType.name),
                                ),
                            ],
                        },
                        {
                            onSuccess() {
                                removeInstanceTypeModalDisclosure.onClose();
                            },
                            onError() {
                                removeInstanceTypeModalDisclosure.onClose();
                            },
                        },
                    );
                }}
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
                        O número máximo de instâncias que o usuário pode ter simultaneamente.
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
                            {userQuery.data?.quotas.allowedInstanceTypes.map(
                                (instanceType, index) => (
                                    <UserPageQuotaCardInstanceTypeCard
                                        key={`user-page-quota-card-instance-type-card-${instanceType.name}-${index}`}
                                        onRemove={() => {
                                            setInstanceTypeToRemove(instanceType.name);
                                            removeInstanceTypeModalDisclosure.onOpen();
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
