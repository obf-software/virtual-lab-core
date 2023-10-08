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
import { useUser } from '../../../hooks/user';
import { getErrorMessage } from '../../../services/helpers';

export const ProfileQuotaCard: React.FC = () => {
    const toast = useToast();
    const { data: user, error, isError, isLoading } = useUser('me');

    if (isError) {
        toast({
            title: 'Erro ao carregar usuário!',
            status: 'error',
            duration: 3000,
            colorScheme: 'red',
            variant: 'left-accent',
            description: getErrorMessage(error),
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
                            value={user?.quota.maxInstances ?? '-'}
                            isReadOnly={true}
                        />
                        <InputRightElement>
                            <Spinner
                                size='sm'
                                hidden={!isLoading}
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
