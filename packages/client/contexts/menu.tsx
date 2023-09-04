import { AddIcon } from '@chakra-ui/icons';
import React, { PropsWithChildren, createContext, useContext, useState } from 'react';

export enum MenuItems {
    HOME = 'HOME',
}

export type MenuItemData = {
    icon: React.ReactElement;
    label: string;
    href: string;
};

export const menuItemsMap: {
    [key in keyof typeof MenuItems]: MenuItemData;
} = {
    HOME: {
        icon: <AddIcon />,
        label: 'Home',
        href: '/',
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
