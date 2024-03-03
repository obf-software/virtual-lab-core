import React, { PropsWithChildren } from 'react';
import { useAuthSessionData } from '../../hooks/use-auth-session-data';
import { Box, Container, Fade, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { Role } from '../../services/api-protocols';
import { roleToDisplayString } from '../../services/helpers';

type RoleSelectionContainerProps = PropsWithChildren & {
    allowedRoles: Role[];
};

export const RoleSelectionContainer: React.FC<RoleSelectionContainerProps> = ({
    children,
    allowedRoles,
}) => {
    const { authSessionData } = useAuthSessionData();

    if (!authSessionData) {
        return (
            <Box>
                <Container
                    maxW={'6xl'}
                    display={'flex'}
                    justifyContent={'center'}
                    alignItems={'center'}
                    height={'70vh'}
                >
                    <Fade in>
                        <Spinner
                            size='xl'
                            speed='1s'
                            thickness='4px'
                            color='blue.500'
                            emptyColor='gray.200'
                        />
                    </Fade>
                </Container>
            </Box>
        );
    }

    if (!allowedRoles.includes(authSessionData.role as Role)) {
        return (
            <Box>
                <Container
                    maxW={'6xl'}
                    display={'flex'}
                    justifyContent={'center'}
                    alignItems={'center'}
                    height={'70vh'}
                >
                    <Stack
                        spacing={4}
                        textAlign={'center'}
                        direction={'column'}
                    >
                        <Fade in>
                            <Heading size={'lg'}>
                                Você não tem permissão para acessar esta página
                            </Heading>
                        </Fade>

                        <Fade in>
                            <Text>
                                As permissões necessárias são:{' '}
                                {allowedRoles.map(roleToDisplayString).join(' ou ')}
                            </Text>
                        </Fade>
                    </Stack>
                </Container>
            </Box>
        );
    }

    return children;
};
