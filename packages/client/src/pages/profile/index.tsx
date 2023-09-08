import React, { useEffect } from 'react';
import { useMenu } from '../../contexts/menu/use-menu';

export const ProfilePage: React.FC = () => {
    const { setActiveMenuItem } = useMenu();

    useEffect(() => {
        setActiveMenuItem(undefined);
    }, []);

    return <>Profile</>;
};
