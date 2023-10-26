import React from 'react';
import { Box, Center, Text } from '@chakra-ui/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useConnection } from '../../hooks/connection';

export const ConnectionPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const connectionString = searchParams.get('connectionString');

    if (!connectionString) {
        return (
            <Center height={'100vh'}>
                <Text>
                    Nenhuma conexão encontrada. Por favor, verifique o link e tente novamente.
                </Text>
            </Center>
        );
    }

    const { display, state, bindControls } = useConnection({ connectionString });

    display.onresize = (_width, height) => {
        display.scale(window.innerHeight / height);
    };

    React.useEffect(() => {
        const { unbindControls } = bindControls();

        return () => {
            unbindControls();
        };
    }, []);

    // const displayHeight = display.getHeight();

    // React.useEffect(() => {
    //     console.log(displayHeight);
    //     if (display.getHeight() === 0) {
    //         return;
    //     }

    //     display.scale(window.innerHeight / displayHeight);
    //     console.log(display.getScale());
    // }, [displayHeight]);

    // // Scale display to fit the screen Height
    // console.log(window.innerHeight);
    // console.log(display.getHeight());

    // display.scale(window.innerHeight / display.getHeight());

    // console.log(display.getScale());

    return (
        <Center>
            <Text>{state}</Text>
            <Box
                w={'100%'}
                h={'100vh'}
                justifyContent={'center'}
                alignItems={'center'}
                display={'flex'}
                ref={(ref) => {
                    ref?.replaceChildren(display.getElement());
                }}
            />
        </Center>
    );
};
