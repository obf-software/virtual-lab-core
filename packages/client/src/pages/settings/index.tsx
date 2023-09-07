import React, { useEffect } from 'react';
import { useMenu } from '../../contexts/menu/use-menu';

export const SettingsPage: React.FC = () => {
    const { setActiveMenuItem } = useMenu();

    useEffect(() => {
        setActiveMenuItem(undefined);
    }, []);

    return <>Settings</>;
};
