import { IconType } from 'react-icons';
import { BiBookBookmark, BiBookContent } from 'react-icons/bi';
import { FiBook, FiBookOpen, FiHome, FiMonitor, FiUser, FiUsers } from 'react-icons/fi';

export enum MenuItems {
    HOME = 'HOME',
    INSTANCES = 'INSTANCES',

    // MY_GROUPS = 'MY_GROUPS',
    ADMIN_TEMPLATES = 'ADMIN_TEMPLATES',
    ADMIN_USERS = 'ADMIN_USERS',
    // ADMIN_GROUPS = 'ADMIN_GROUPS',
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
        icon: FiHome,
        label: 'Início',
        href: '/',
        adminOnly: false,
    },
    INSTANCES: {
        icon: FiMonitor,
        label: 'Instâncias',
        href: '/instances',
        adminOnly: false,
    },
    // MY_GROUPS: {
    //     icon: FiUsers,
    //     label: 'Meus Grupos',
    //     href: '/user-groups',
    //     adminOnly: false,
    // },

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
    // ADMIN_GROUPS: {
    //     icon: FiUsers,
    //     label: 'Grupos',
    //     href: '/admin/groups',
    //     adminOnly: true,
    // },
};

export interface MenuContextData {
    getActiveMenuItem: () => { id: keyof typeof MenuItems; data: MenuItemData } | undefined;
    setActiveMenuItem: (id?: keyof typeof MenuItems) => void;
}
