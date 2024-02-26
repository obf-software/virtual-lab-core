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
    Tooltip,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { FiCheck, FiClock } from 'react-icons/fi';
import { useAuthSessionData } from '../../../hooks/use-auth-session-data';
import { confirmUserAttribute, sendUserAttributeVerificationCode } from 'aws-amplify/auth';
import { getErrorMessage } from '../../../services/helpers';

export const ProfilePageInfoCard: React.FC = () => {
    const { authSessionData, refetchAuthSessionData } = useAuthSessionData();
    const [isWaitingForVerificationCode, setIsWaitingForVerificationCode] = React.useState(false);
    const [isVerificationButtonLoading, setIsVerificationButtonLoading] = React.useState(false);
    const [verificationCode, setVerificationCode] = React.useState<string>();
    const toast = useToast();

    return (
        <VStack
            spacing={4}
            align={'start'}
        >
            <Heading
                size={'xl'}
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
                    <FormControl mr='2%'>
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
                            isReadOnly
                        />
                    </FormControl>

                    <FormControl>
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
                            isReadOnly
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
                    <Input
                        id='name'
                        type='text'
                        placeholder='Insira seu nome'
                        value={'currentName'}
                    />
                </FormControl>

                <FormControl mt={'2%'}>
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
                            isReadOnly
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
