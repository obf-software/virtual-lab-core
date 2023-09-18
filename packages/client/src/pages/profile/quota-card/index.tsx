import {
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    VStack,
    useToast,
} from '@chakra-ui/react';
import React from 'react';
import { UserQuota } from '../../../services/api/protocols';
import { getUserQuota } from '../../../services/api/service';

export const ProfileQuotaCard: React.FC = () => {
    const [quota, setQuota] = React.useState<UserQuota>();
    const toast = useToast();

    const loadUserQuota = React.useCallback(async () => {
        const response = await getUserQuota(undefined);
        if (response.error !== undefined) {
            toast({
                title: 'Erro ao carregar quota!',
                status: 'error',
                duration: 3000,
                colorScheme: 'red',
                variant: 'left-accent',
                description: `${response.error}`,
                position: 'bottom-left',
            });
            return;
        }

        setQuota(response.data);
    }, [getUserQuota, setQuota]);

    React.useEffect(() => {
        loadUserQuota().catch((error) => console.error(error));
    }, [loadUserQuota]);

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
                    <Input
                        id='instances'
                        type='text'
                        value={quota?.maxInstances ?? '-'}
                        isReadOnly={true}
                    />
                    <FormHelperText>
                        Quantidade de instâncias simultâneas que o usuário pode ter
                    </FormHelperText>
                </FormControl>
            </Box>
        </VStack>
    );
};
