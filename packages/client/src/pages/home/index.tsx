import React from 'react';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        navigate('/instances');
    }, [navigate]);

    return <></>;
};
