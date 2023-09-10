import React, { useEffect } from 'react';
import { useMenuContext } from '../../contexts/menu/hook';

export const SettingsPage: React.FC = () => {
    const { setActiveMenuItem } = useMenuContext();

    useEffect(() => {
        setActiveMenuItem(undefined);
    }, []);

    return <>Settings</>;
};
