import React, { PropsWithChildren, useState } from 'react';
import { MenuContext } from './context';
import { MenuItems, menuItemsMap } from './protocol';

export const MenuProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [activeItem, setActiveItem] = useState<keyof typeof MenuItems | undefined>(undefined);

    const getActiveMenuItem = () => {
        if (activeItem === undefined) {
            return undefined;
        }

        return {
            id: activeItem,
            data: menuItemsMap[activeItem],
        };
    };

    const setActiveMenuItem = (id?: keyof typeof MenuItems) => {
        setActiveItem(id);
    };

    return (
        <MenuContext.Provider value={{ getActiveMenuItem, setActiveMenuItem }}>
            {children}
        </MenuContext.Provider>
    );
};
