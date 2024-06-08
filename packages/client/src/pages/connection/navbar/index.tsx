import { Button, Flex, Heading, HStack, Image } from '@chakra-ui/react';
import React from 'react';
import { Link } from 'react-router-dom';

interface ConnectionPageNavbarProps {
    instanceName: string | undefined;
    onDisconnect: () => void;
}

export const ConnectionPageNavbar: React.FC<ConnectionPageNavbarProps> = ({
    instanceName,
    onDisconnect,
}) => {
    return (
        <Flex
            px='5'
            height='60px'
            alignItems='center'
            bg={'white'}
            borderBottomWidth='1px'
            borderBottomColor={'gray.200'}
            justifyContent='space-between'
        >
            <HStack
                spacing={4}
                paddingRight={4}
            >
                <Image
                    src='/emblem-light.png'
                    alt='Virtual Lab'
                    height='10'
                    width='10'
                />

                <Heading
                    fontSize='x-large'
                    fontFamily='monospace'
                    fontWeight='bold'
                >
                    Virtual Lab
                </Heading>
            </HStack>

            <Heading
                fontSize='lg'
                fontWeight='semibold'
            >
                {instanceName}
            </Heading>

            <Button
                variant='outline'
                colorScheme='red'
                size='sm'
                onClick={onDisconnect}
            >
                <Link to='/instances'>Encerrar sessão</Link>
            </Button>
        </Flex>
    );
};
