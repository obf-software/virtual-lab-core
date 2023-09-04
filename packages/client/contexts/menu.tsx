import React, { PropsWithChildren, createContext, useContext, useState } from 'react';
import { IconType } from 'react-icons';
import { FiHome, FiMonitor, FiServer, FiUser, FiUsers } from 'react-icons/fi';

export enum MenuItems {
    HOME = 'HOME',
    INSTANCES = 'INSTANCES',
    USERS = 'USERS',
    GROUPS = 'GROUPS',
}

export type MenuItemData = {
    icon: IconType;
    label: string;
    href: string;
};

export const menuItemsMap: {
    [key in keyof typeof MenuItems]: MenuItemData;
} = {
    HOME: {
        icon: FiHome,
        label: 'Início',
        href: '/',
    },
    INSTANCES: {
        icon: FiMonitor,
        label: 'Instâncias',
        href: '/instances',
    },
    USERS: {
        icon: FiUser,
        label: 'Usuários',
        href: '/users',
    },
    GROUPS: {
        icon: FiUsers,
        label: 'Grupos',
        href: '/groups',
    },
};

const defaultMenuItem: keyof typeof MenuItems = 'HOME';

interface MenuContextData {
    getActiveMenuItem: () => { id: keyof typeof MenuItems; data: MenuItemData };
    setActiveMenuItem: (id: keyof typeof MenuItems) => void;
}

const MenuContext = createContext<MenuContextData>({} as MenuContextData);

export const MenuProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [activeItem, setActiveItem] = useState<keyof typeof MenuItems>(defaultMenuItem);

    const getActiveMenuItem = () => {
        return {
            id: activeItem,
            data: menuItemsMap[activeItem],
        };
    };

    const setActiveMenuItem = (id: keyof typeof MenuItems) => {
        setActiveItem(id);
    };

    return (
        <MenuContext.Provider value={{ getActiveMenuItem, setActiveMenuItem }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = (): MenuContextData => {
    const context = useContext(MenuContext);
    return context;
};
