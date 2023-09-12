import { IconType } from 'react-icons';
import { FiHome, FiMonitor, FiShoppingBag, FiUser, FiUsers } from 'react-icons/fi';

export enum MenuItems {
    HOME = 'HOME',
    INSTANCES = 'INSTANCES',
    MY_GROUPS = 'MY_GROUPS',
    ADMIN_USERS = 'ADMIN_USERS',
    ADMIN_GROUPS = 'ADMIN_GROUPS',
    ADMIN_PORTFOLIOS = 'ADMIN_PORTFOLIOS',
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
    HOME: {
        icon: FiHome as IconType,
        label: 'Início',
        href: '/',
        adminOnly: false,
    },
    INSTANCES: {
        icon: FiMonitor as IconType,
        label: 'Instâncias',
        href: '/instances',
        adminOnly: false,
    },
    MY_GROUPS: {
        icon: FiUsers as IconType,
        label: 'Meus Grupos',
        href: '/my-groups',
        adminOnly: false,
    },

    /**
     * Admin menu items
     */

    ADMIN_USERS: {
        icon: FiUser as IconType,
        label: 'Usuários',
        href: '/admin/users',
        adminOnly: true,
    },
    ADMIN_GROUPS: {
        icon: FiUsers as IconType,
        label: 'Grupos',
        href: '/admin/groups',
        adminOnly: true,
    },
    ADMIN_PORTFOLIOS: {
        icon: FiShoppingBag as IconType,
        label: 'Portfólios',
        href: '/admin/portfolios',
        adminOnly: true,
    },
};

export interface MenuContextData {
    getActiveMenuItem: () => { id: keyof typeof MenuItems; data: MenuItemData } | undefined;
    setActiveMenuItem: (id?: keyof typeof MenuItems) => void;
}
