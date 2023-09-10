import {
    Box,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    VStack,
} from '@chakra-ui/react';
import React from 'react';

export const ProfileQuotaCard: React.FC = () => {
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
                        value={'1'}
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
