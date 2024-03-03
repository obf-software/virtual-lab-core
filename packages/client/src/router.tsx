import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/main';
import { HomePage } from './pages/home';
import { InstancesPage } from './pages/instances';
import { UsersPage } from './pages/users';
import { ProfilePage } from './pages/profile';
import { ConnectionPage } from './pages/connection';
import { NewInstancePage } from './pages/new-instance';
import { TemplatesPage } from './pages/templates';
import { RoleSelectionContainer } from './components/role-selection-container';
import { UserPage } from './pages/user';

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
                path: 'profile',
                element: (
                    <RoleSelectionContainer allowedRoles={['PENDING', 'USER', 'ADMIN']}>
                        <ProfilePage />
                    </RoleSelectionContainer>
                ),
            },
            {
                path: 'instances',
                element: (
                    <RoleSelectionContainer allowedRoles={['USER', 'ADMIN']}>
                        <InstancesPage />
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
            {
                path: 'admin/user/:userId',
                element: (
                    <RoleSelectionContainer allowedRoles={['ADMIN']}>
                        <UserPage />
                    </RoleSelectionContainer>
                ),
            },
        ],
    },
    {
        path: 'connection',
        element: <ConnectionPage />,
    },
]);
