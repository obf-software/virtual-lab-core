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
import { User, UserQuota } from '../../../services/api/protocols';
import { getUser } from '../../../services/api/service';

export const ProfileQuotaCard: React.FC = () => {
    const [user, setUser] = React.useState<User & { quota: UserQuota }>();
    const [isLoading, setIsLoading] = React.useState(false);
    const toast = useToast();

    const loadUser = React.useCallback(async () => {
        setIsLoading(true);
        const response = await getUser(undefined);
        setIsLoading(false);
        if (response.error !== undefined) {
            toast({
                title: 'Erro ao carregar usuário!',
                status: 'error',
                duration: 3000,
                colorScheme: 'red',
                variant: 'left-accent',
                description: `${response.error}`,
                position: 'bottom-left',
            });
            return;
        }

        setUser(response.data);
    }, [getUser, setUser]);

    React.useEffect(() => {
        loadUser().catch((error) => console.error(error));
    }, [loadUser]);

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
