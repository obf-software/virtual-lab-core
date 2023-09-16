import React, { useEffect } from 'react';
import { Center } from '@chakra-ui/react';
import { useConnectionContext } from '../../contexts/connection/hook';
import { useNavigate } from 'react-router-dom';

export const ConnectionPage: React.FC = () => {
    const { element, connectionState } = useConnectionContext();
    const navigate = useNavigate();

    useEffect(() => {
        if (connectionState === 'DISCONNECTED' || connectionState === 'IDDLE') {
            navigate('/instances');
        }
    }, [connectionState]);

    return <Center>{element}</Center>;
};
