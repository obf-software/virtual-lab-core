import { useAuthenticator } from '@aws-amplify/ui-react';
import {
    Box,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Icon,
    Input,
    InputGroup,
    InputRightElement,
    VStack,
} from '@chakra-ui/react';
import React from 'react';
import { IconType } from 'react-icons';
import { FiCheck, FiClock } from 'react-icons/fi';
import { parseSessionData } from '../../../services/helpers';

interface ProfileInfoCardProps {
    currentName: string;
    onCurrentNameChange: (newName: string) => void;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
    currentName,
    onCurrentNameChange,
}) => {
    const { user } = useAuthenticator((context) => [context.user]);
    const { displayRole, email, emailVerified } = parseSessionData(user);

    return (
        <VStack
            align={'start'}
            pb={10}
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
                p={4}
                borderRadius={12}
                boxShadow={'sm'}
            >
                <Flex mt='2%'>
                    <FormControl mr='2%'>
                        <FormLabel id='username'>Usuário</FormLabel>
                        <Input
                            id='username'
                            type='text'
                            value={user.username}
                            isReadOnly
                        />
                    </FormControl>

                    <FormControl>
                        <FormLabel id='role'>Cargo</FormLabel>
                        <Input
                            id='role'
                            type='text'
                            value={displayRole}
                            isReadOnly
                        />
                    </FormControl>
                </Flex>

                <FormControl mt={'2%'}>
                    <FormLabel id='name'>Nome</FormLabel>
                    <Input
                        id='name'
                        type='text'
                        placeholder='Insira seu nome'
                        value={currentName}
                        onChange={(e) => onCurrentNameChange(e.target.value)}
                    />
                </FormControl>

                <FormControl mt={'2%'}>
                    <FormLabel id='email'>Email</FormLabel>
                    <InputGroup>
                        <Input
                            id='email'
                            type='email'
                            value={email}
                            isReadOnly
                        />
                        <InputRightElement>
                            <Icon
                                as={(emailVerified ? FiCheck : FiClock) as IconType}
                                color={emailVerified ? 'green.500' : 'yellow.500'}
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormHelperText>
                        Com o email verificado, você pode recuperar sua senha.
                    </FormHelperText>
                </FormControl>
            </Box>
        </VStack>
    );
};
