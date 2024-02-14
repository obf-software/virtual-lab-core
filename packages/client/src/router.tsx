import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layouts/main';
import { HomePage } from './pages/home';
import { InstancesPage } from './pages/instances';
import { UsersPage } from './pages/users';
import { GroupsPage } from './pages/groups';
import { ProfilePage } from './pages/profile';
import { ConnectionPage } from './pages/connection';
// import { NewInstancePage } from './pages/new-instance';
import { UserGroupsPage } from './pages/user-groups';
import { NewInstancePage } from './pages/new-instance';

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
                element: <InstancesPage />,
            },
            {
                path: 'new-instance',
                element: <NewInstancePage />,
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
            //     path: 'admin/users',
            //     element: <UsersPage />,
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
