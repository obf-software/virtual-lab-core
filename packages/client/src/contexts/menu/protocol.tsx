import { IconType } from 'react-icons';
import { BiBookBookmark } from 'react-icons/bi';
import { FiMonitor, FiUser } from 'react-icons/fi';

export enum MenuItems {
    INSTANCES = 'INSTANCES',
    ADMIN_TEMPLATES = 'ADMIN_TEMPLATES',
    ADMIN_USERS = 'ADMIN_USERS',
}

interface MenuItemData {
    icon: IconType;
    label: string;
    href: string;
    adminOnly: boolean;
}

export const menuItemsMap: {
    [key in keyof typeof MenuItems]: MenuItemData;
} = {
    INSTANCES: {
        icon: FiMonitor,
        label: 'Instâncias',
        href: '/instances',
        adminOnly: false,
    },

    ADMIN_TEMPLATES: {
        icon: BiBookBookmark,
        label: 'Templates',
        href: '/admin/templates',
        adminOnly: true,
    },
    ADMIN_USERS: {
        icon: FiUser,
        label: 'Usuários',
        href: '/admin/users',
        adminOnly: true,
    },
};

export interface MenuContextData {
    getActiveMenuItem: () => { id: keyof typeof MenuItems; data: MenuItemData } | undefined;
    setActiveMenuItem: (id?: keyof typeof MenuItems) => void;
}
