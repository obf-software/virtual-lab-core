import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/main';
import { HomePage } from './pages/home';
import { InstancesPage } from './pages/instances';
import { UsersPage } from './pages/users';
import { GroupsPage } from './pages/groups';
import { SettingsPage } from './pages/settings';
import { ProfilePage } from './pages/profile';
import { UsersProvider } from './contexts/users/provider';
import { GroupsProvider } from './contexts/groups/provider';

/**
 * TODO: Filter routes based on user's authorization
 */
export const Router: React.FC = () => {
    const router = createBrowserRouter([
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
                    element: <InstancesPage />,
                },
                {
                    path: 'my-groups',
                    element: <>WIP</>,
                },
                {
                    path: 'settings',
                    element: <SettingsPage />,
                },
                {
                    path: 'profile',
                    element: <ProfilePage />,
                },

                {
                    path: 'admin/users',
                    element: (
                        <UsersProvider>
                            <UsersPage />
                        </UsersProvider>
                    ),
                },
                {
                    path: 'admin/groups',
                    element: (
                        <GroupsProvider>
                            <GroupsPage />
                        </GroupsProvider>
                    ),
                },
                {
                    path: 'admin/portfolios',
                    element: <>WIP</>,
                },
            ],
            // errorElement: <div>error</div>,
        },
    ]);

    return <RouterProvider router={router} />;
};
