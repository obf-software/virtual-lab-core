import { Authenticator } from '@aws-amplify/ui-react';
import React, { PropsWithChildren } from 'react';
import { Box, Heading } from '@chakra-ui/react';

export const AuthContainer: React.FC<PropsWithChildren> = ({ children }) => {
    return (
        <Authenticator
            initialState='signIn'
            loginMechanisms={['username', 'email']}
            variation='modal'
            components={{
                Header: () => {
                    return (
                        <Box
                            bgColor={'white'}
                            roundedTop={8}
                            borderTop={'4px'}
                            borderLeft={'1px'}
                            borderRight={'1px'}
                        >
                            <Heading
                                as='h1'
                                size='xl'
                                textAlign='center'
                                fontFamily={'mono'}
                                py={6}
                            >
                                Virtual Lab
                            </Heading>
                        </Box>
                    );
                },
                Footer: () => {
                    return (
                        <Box
                            bgColor={'white'}
                            roundedBottom={8}
                            borderBottom={'4px'}
                            borderLeft={'1px'}
                            borderRight={'1px'}
                        />
                    );
                },
            }}
        >
            {children}
        </Authenticator>
    );
};
