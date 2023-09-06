'use client';
import { Box, Container, Spinner } from '@chakra-ui/react';

export default function Loading() {
    return (
        <Box>
            <Container
                maxW={'6xl'}
                h={'75vh'}
                centerContent
                justifyContent={'center'}
            >
                <Spinner
                    color='blue.400'
                    size={'xl'}
                    thickness='4px'
                    speed='1s'
                />
            </Container>
        </Box>
    );
}
