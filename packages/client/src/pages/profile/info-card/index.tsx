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
import { confirmUserAttribute, sendUserAttributeVerificationCode } from 'aws-amplify/auth';
import { getErrorMessage, roleToDisplayString } from '../../../services/helpers';
import { useUser } from '../../../hooks/use-user';

export const ProfilePageInfoCard: React.FC = () => {
    const { userQuery } = useUser({ userId: 'me' });
    const { authSessionData, refetchAuthSessionData } = useAuthSessionData();

    const [isWaitingForVerificationCode, setIsWaitingForVerificationCode] = React.useState(false);
    const [isVerificationButtonLoading, setIsVerificationButtonLoading] = React.useState(false);
    const [verificationCode, setVerificationCode] = React.useState<string>();
    const isEmailVerified = authSessionData?.email_verified === 'true';

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
                        isDisabled={userQuery.isLoading}
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

                    <FormControl
                        isReadOnly
                        isDisabled={userQuery.isLoading}
                    >
                        <FormLabel
                            id='role'
                            fontWeight={'bold'}
                        >
                            Cargo
                        </FormLabel>
                        <InputGroup>
                            <Input
                                id='role'
                                type='text'
                                value={roleToDisplayString(userQuery.data?.role)}
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
                </Flex>

                <FormControl
                    mt={'2%'}
                    isReadOnly
                    isDisabled={userQuery.isLoading}
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
                            label={isEmailVerified ? 'Email verificado' : 'Email não verificado'}
                        >
                            <InputRightElement>
                                {authSessionData === undefined ? (
                                    <Spinner
                                        size='sm'
                                        color='gray.500'
                                    />
                                ) : (
                                    <Icon
                                        as={isEmailVerified ? FiCheck : FiClock}
                                        color={isEmailVerified ? 'green.500' : 'yellow.500'}
                                    />
                                )}
                            </InputRightElement>
                        </Tooltip>
                    </InputGroup>
                    <FormHelperText>
                        Com o email verificado, você pode recuperar sua senha.
                    </FormHelperText>
                </FormControl>

                <Fade in={isEmailVerified !== true}>
                    {isEmailVerified !== true && (
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
