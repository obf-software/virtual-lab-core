import React, { useEffect } from 'react';
import { Box, Center } from '@chakra-ui/react';
import { useConnectionContext } from '../../contexts/connection/hook';
import { useNavigate } from 'react-router-dom';

export const ConnectionPage: React.FC = () => {
    const { element, connectionState, unbindControls } = useConnectionContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (connectionState === 'DISCONNECTED' || connectionState === 'IDDLE') {
            unbindControls();
            navigate('/instances');
        }
    }, [connectionState]);

    return (
        <Center>
            {/* <Box
                bgColor={'black'}
                w={'100%'}
                h={'100vh'}
                justifyContent={'center'}
                alignItems={'center'}
                display={'flex'}
                ref={(ref) => {
                    // ref?.remove();
                    element ? ref?.appendChild(element) : null;
                }}
            /> */}
            {element}
        </Center>
    );
};
