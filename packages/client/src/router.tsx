import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/main';
import { HomePage } from './pages/home';
import { InstancesPage } from './pages/instances';
import { UsersPage } from './pages/users';
import { GroupsPage } from './pages/groups';
import { ProfilePage } from './pages/profile';
import { ConnectionPage } from './pages/connection';
import { UserGroupsPage } from './pages/user-groups';
import { NewInstancePage } from './pages/new-instance';
import { TemplatesPage } from './pages/templates';
import { RoleSelectionContainer } from './components/role-selection-container';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <HomePage />,
            },
            {
                path: 'instances',
                element: (
                    <RoleSelectionContainer allowedRoles={['USER', 'ADMIN']}>
                        <InstancesPage />,
                    </RoleSelectionContainer>
                ),
            },
            {
                path: 'instances/new',
                element: (
                    <RoleSelectionContainer allowedRoles={['USER', 'ADMIN']}>
                        <NewInstancePage />
                    </RoleSelectionContainer>
                ),
            },
            {
                path: 'admin/templates',
                element: (
                    <RoleSelectionContainer allowedRoles={['ADMIN']}>
                        <TemplatesPage />
                    </RoleSelectionContainer>
                ),
            },
            {
                path: 'admin/users',
                element: (
                    <RoleSelectionContainer allowedRoles={['ADMIN']}>
                        <UsersPage />
                    </RoleSelectionContainer>
                ),
            },
            // {
            //     path: 'user-groups',
            //     element: <UserGroupsPage />,
            // },
            // {
            //     path: 'profile',
            //     element: <ProfilePage />,
            // },
            // {
            //     path: 'admin/groups',
            //     element: <GroupsPage />,
            // },
        ],
        // errorElement: <div>error</div>,
    },
    {
        path: 'connection',
        element: <ConnectionPage />,
    },
]);
