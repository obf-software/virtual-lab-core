import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/main';
import { HomePage } from './pages/home';
import { InstancesPage } from './pages/instances';
import { UsersPage } from './pages/users';
import { GroupsPage } from './pages/groups';
import { SettingsPage } from './pages/settings';
import { ProfilePage } from './pages/profile';
import { GroupsProvider } from './contexts/groups/provider';
import { MyGroupsProvider } from './contexts/my-groups/provider';

import { ConnectionPage } from './pages/connection';
import { NewInstancePage } from './pages/new-instance';
import { UserGroupsPage } from './pages/user-groups';

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
                    path: 'new-instance',
                    element: <NewInstancePage />,
                },
                {
                    path: 'my-groups',
                    element: (
                        <MyGroupsProvider>
                            <UserGroupsPage />
                        </MyGroupsProvider>
                    ),
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
                    element: <UsersPage />,
                },
                {
                    path: 'admin/groups',
                    element: (
                        <GroupsProvider>
                            <GroupsPage />
                        </GroupsProvider>
                    ),
                },
            ],
            // errorElement: <div>error</div>,
        },
        {
            path: 'connection',
            element: <ConnectionPage />,
        },
    ]);

    return <RouterProvider router={router} />;
};
