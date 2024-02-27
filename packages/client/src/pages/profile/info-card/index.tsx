import {
    Box,
    Button,
    Fade,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Heading,
    Icon,
    Input,
    InputGroup,
    InputRightElement,
    PinInput,
    PinInputField,
    Spinner,
    Tooltip,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { FiCheck, FiClock } from 'react-icons/fi';
import { useAuthSessionData } from '../../../hooks/use-auth-session-data';
import {
    confirmUserAttribute,
    sendUserAttributeVerificationCode,
    updateUserAttribute,
} from 'aws-amplify/auth';
import { getErrorMessage } from '../../../services/helpers';

export const ProfilePageInfoCard: React.FC = () => {
    const { authSessionData, refetchAuthSessionData } = useAuthSessionData();

    const [isWaitingForVerificationCode, setIsWaitingForVerificationCode] = React.useState(false);
    const [isVerificationButtonLoading, setIsVerificationButtonLoading] = React.useState(false);
    const [verificationCode, setVerificationCode] = React.useState<string>();

    const [inputName, setInputName] = React.useState<string>(authSessionData?.name ?? '');
    const [isUpdatingName, setIsUpdatingName] = React.useState(false);

    React.useEffect(() => {
        setInputName(authSessionData?.name ?? '');
    }, [authSessionData]);

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
                <Flex>
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

                        <Input
                            id='username'
                            type='text'
                            value={authSessionData?.username}
                        />
                    </FormControl>

                    <FormControl isReadOnly>
                        <FormLabel
                            id='role'
                            fontWeight={'bold'}
                        >
                            Cargo
                        </FormLabel>
                        <Input
                            id='role'
                            type='text'
                            value={authSessionData?.displayRole}
                        />
                    </FormControl>
                </Flex>

                <FormControl mt={'2%'}>
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
                            placeholder='Insira seu nome'
                            value={inputName}
                            onChange={(event) => {
                                setInputName(event.target.value);
                            }}
                            onBlur={() => {
                                if (inputName !== authSessionData?.name) {
                                    setIsUpdatingName(true);
                                    updateUserAttribute({
                                        userAttribute: {
                                            attributeKey: 'name',
                                            value: inputName,
                                        },
                                    })
                                        .then(() => {
                                            setIsUpdatingName(false);
                                            toast({
                                                title: 'Nome atualizado',
                                                description: 'Seu nome foi atualizado com sucesso',
                                                status: 'success',
                                                duration: 5000,
                                                isClosable: true,
                                            });
                                        })
                                        .catch((error) => {
                                            setIsUpdatingName(false);
                                            setInputName(authSessionData?.name ?? '');
                                            toast({
                                                title: 'Erro ao atualizar nome',
                                                description: getErrorMessage(error),
                                                status: 'error',
                                                duration: 5000,
                                                isClosable: true,
                                            });
                                        });
                                }
                            }}
                        />
                        <InputRightElement>
                            {isUpdatingName && (
                                <Spinner
                                    size='sm'
                                    hidden={!isUpdatingName}
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
                        id='email'
                        fontWeight={'bold'}
                    >
                        Email
                    </FormLabel>
                    <InputGroup>
                        <Input
                            id='email'
                            type='email'
                            value={authSessionData?.email}
                        />
                        <Tooltip
                            label={
                                authSessionData?.email_verified === 'true'
                                    ? 'Email verificado'
                                    : 'Email não verificado'
                            }
                        >
                            <InputRightElement>
                                <Icon
                                    as={
                                        authSessionData?.email_verified === 'true'
                                            ? FiCheck
                                            : FiClock
                                    }
                                    color={
                                        authSessionData?.email_verified === 'true'
                                            ? 'green.500'
                                            : 'yellow.500'
                                    }
                                />
                            </InputRightElement>
                        </Tooltip>
                    </InputGroup>
                    <FormHelperText>
                        Com o email verificado, você pode recuperar sua senha.
                    </FormHelperText>
                </FormControl>

                <Fade in={authSessionData !== undefined}>
                    {authSessionData !== undefined &&
                        authSessionData?.email_verified !== 'true' && (
                            <Flex mt={'2%'}>
                                <Button
                                    colorScheme={'blue'}
                                    variant={'outline'}
                                    isLoading={isVerificationButtonLoading}
                                    onClick={() => {
                                        setIsVerificationButtonLoading(true);

                                        sendUserAttributeVerificationCode({
                                            userAttributeKey: 'email',
                                        })
                                            .then((output) => {
                                                const deliveryMediumMap: Record<string, string> = {
                                                    EMAIL: output.destination
                                                        ? `Um código de verificação foi enviado para ${output.destination}`
                                                        : 'Um código de verificação foi enviado para o seu email',
                                                    PHONE: output.destination
                                                        ? `Um código de verificação foi enviado para ${output.destination}`
                                                        : 'Um código de verificação foi enviado para o seu telefone',
                                                    SMS: output.destination
                                                        ? `Um código de verificação foi enviado para ${output.destination}`
                                                        : 'Um código de verificação foi enviado para o seu telefone',
                                                    UNKNOWN:
                                                        'Um código de verificação foi enviado para algum de seus dispositivos',
                                                };

                                                toast({
                                                    title: 'Código de verificação enviado',
                                                    description: `${deliveryMediumMap[output.deliveryMedium ?? 'UNKNOWN']}. Copie e cole o código no campo a seguir.`,
                                                    status: 'success',
                                                    duration: 5000,
                                                    isClosable: true,
                                                });

                                                setIsWaitingForVerificationCode(true);
                                                setIsVerificationButtonLoading(false);
                                            })
                                            .catch((error) => {
                                                setIsVerificationButtonLoading(false);
                                                toast({
                                                    title: 'Erro ao enviar código de verificação',
                                                    description: getErrorMessage(error),
                                                    status: 'error',
                                                    duration: 5000,
                                                    isClosable: true,
                                                });
                                            });
                                    }}
                                >
                                    {isWaitingForVerificationCode
                                        ? 'Reenviar código'
                                        : 'Verificar email'}
                                </Button>

                                <HStack
                                    ml={'2%'}
                                    hidden={!isWaitingForVerificationCode}
                                >
                                    <PinInput
                                        type='number'
                                        isDisabled={isVerificationButtonLoading}
                                        value={verificationCode}
                                        onChange={(value) => {
                                            setVerificationCode(value);
                                        }}
                                        onComplete={(code) => {
                                            setIsVerificationButtonLoading(true);
                                            confirmUserAttribute({
                                                userAttributeKey: 'email',
                                                confirmationCode: code,
                                            })
                                                .then(() => {
                                                    setIsVerificationButtonLoading(false);
                                                    setIsWaitingForVerificationCode(false);
                                                    setVerificationCode(undefined);

                                                    toast({
                                                        title: 'Email verificado',
                                                        description:
                                                            'Seu email foi verificado com sucesso',
                                                        status: 'success',
                                                        duration: 5000,
                                                        isClosable: true,
                                                    });

                                                    refetchAuthSessionData().catch(console.error);
                                                })
                                                .catch((error) => {
                                                    setIsVerificationButtonLoading(false);
                                                    setVerificationCode('');

                                                    toast({
                                                        title: 'Erro ao verificar email',
                                                        description: getErrorMessage(error),
                                                        status: 'error',
                                                        duration: 5000,
                                                        isClosable: true,
                                                    });
                                                });
                                        }}
                                    >
                                        <PinInputField />
                                        <PinInputField />
                                        <PinInputField />
                                        <PinInputField />
                                        <PinInputField />
                                        <PinInputField />
                                    </PinInput>
                                </HStack>
                            </Flex>
                        )}
                </Fade>
            </Box>
        </VStack>
    );
};
