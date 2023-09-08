import { IconType } from 'react-icons';
import { FiHome, FiMonitor, FiUser, FiUsers } from 'react-icons/fi';

export enum MenuItems {
    HOME = 'HOME',
    INSTANCES = 'INSTANCES',
    USERS = 'USERS',
    GROUPS = 'GROUPS',
}

interface MenuItemData {
    icon: IconType;
    label: string;
    href: string;
}

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

export interface MenuContextData {
    getActiveMenuItem: () => { id: keyof typeof MenuItems; data: MenuItemData } | undefined;
    setActiveMenuItem: (id?: keyof typeof MenuItems) => void;
}
