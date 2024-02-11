import {
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Spinner,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { useUser } from '../../../hooks/use-user';
import { getErrorMessage } from '../../../services/helpers';

export const ProfileQuotaCard: React.FC = () => {
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
            align={'start'}
            pb={10}
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
                p={4}
                borderRadius={12}
                boxShadow={'sm'}
            >
                <FormControl>
                    <FormLabel id='instances'>Instâncias</FormLabel>
                    <InputGroup>
                        <Input
                            id='instances'
                            type='text'
                            value={userQuery.data?.quotas.maxInstances ?? '-'}
                            isReadOnly={true}
                        />
                        <InputRightElement>
                            <Spinner
                                size='sm'
                                hidden={!userQuery.isLoading}
                            />
                        </InputRightElement>
                    </InputGroup>
                    <FormHelperText>
                        Quantidade de instâncias simultâneas que o usuário pode ter
                    </FormHelperText>
                </FormControl>
            </Box>
        </VStack>
    );
};
