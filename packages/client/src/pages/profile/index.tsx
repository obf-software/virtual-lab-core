import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';

export const ProfilePage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();

    useEffect(() => {
        setActiveMenuItem(undefined);
    }, []);

    return <>Profile</>;
};
