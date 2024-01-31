/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { fetchAuthSession } from 'aws-amplify/auth';
import {
    ApiResponse,
    Group,
    Instance,
    InstanceConnection,
    InstanceTemplate,
    Role,
    SeekPaginated,
    UrlPath,
    User,
    VirtualInstanceState,
} from './protocols';
import { getErrorMessage } from '../helpers';

const executeRequest = async <T>(props: {
    path: UrlPath;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    queryParams?: Record<string, string | number | undefined>;
    headers?: Record<string, string>;
}): Promise<ApiResponse<T>> => {
    try {
        const origin = new URL(import.meta.env.VITE_APP_API_URL).origin;
        const url = new URL(`${origin}${props.path}`);

        if (props.queryParams !== undefined) {
            Object.entries(props.queryParams).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, `${value}`);
                }
            });
        }

        const { tokens } = await fetchAuthSession();
        const idToken = tokens?.idToken?.toString();

        const response = await fetch(url, {
            method: props.method,
            body: props.body !== undefined ? JSON.stringify(props.body) : undefined,
            headers: {
                ...(props.headers ?? {}),
                Authorization: `Bearer ${idToken}`,
            },
        });

        if (response.ok === false) {
            const reason = await response.text();
            console.log(`API ${response.url} returned "${response.status}" "${reason}"`);
            return { success: false, error: reason };
        }

        let data = undefined;

        try {
            data = (await response.json()) as T;
        } catch (error) {
            console.error(`Api call to ${props.path} returned invalid JSON`);
            data = {} as T;
        }

        return {
            success: true,
            data,
        };
    } catch (error) {
        const reason = getErrorMessage(error);
        console.log(`Error while fetching API data: ${reason}`);
        return { success: false, error: reason };
    }
};

// GROUP MODULE

export const createGroup = async (props: { name: string; description: string }) =>
    executeRequest<Group>({
        path: '/api/v1/groups',
        method: 'POST',
        body: props,
    });

export const deleteGroup = async (props: { groupId: string }) =>
    executeRequest<void>({
        path: `/api/v1/groups/${props.groupId}`,
        method: 'DELETE',
    });

export const linkUsersToGroup = async (props: { groupId: number; userIds: number[] }) =>
    executeRequest<void>({
        path: `/api/v1/groups/${props.groupId}/link-users`,
        method: 'POST',
        body: { userIds: props.userIds },
    });

export const listGroups = async (props: {
    orderBy: 'creationDate' | 'lastUpdate' | 'name';
    order: 'asc' | 'desc';
    resultsPerPage: number;
    page: number;
    createdBy?: string;
    userId?: string;
    textQuery?: string;
}) =>
    executeRequest<SeekPaginated<Group>>({
        path: '/api/v1/groups',
        method: 'GET',
        queryParams: props,
    });

export const unlinkUsersFromGroup = async (props: { groupId: number; userIds: number[] }) =>
    executeRequest<void>({
        path: `/api/v1/groups/${props.groupId}/unlink-users`,
        method: 'POST',
        body: { userIds: props.userIds },
    });

export const updateGroup = async (props: {
    groupId: string;
    name?: string;
    description?: string;
}) =>
    executeRequest<Group>({
        path: `/api/v1/groups/${props.groupId}`,
        method: 'PATCH',
        body: {
            name: props.name,
            description: props.description,
        },
    });

// INSTANCE MODULE

export const deleteInstance = async (props: { instanceId: string }) =>
    executeRequest<void>({
        path: `/api/v1/instances/${props.instanceId}`,
        method: 'DELETE',
    });

export const getInstanceConnection = async (props: { instanceId: string }) =>
    executeRequest<InstanceConnection>({
        path: `/api/v1/instances/${props.instanceId}/connection`,
        method: 'GET',
    });

export const launchInstance = async (props: {
    templateId: string;
    enableHibernation: boolean;
    instanceType: string;
    ownerId: string;
}) =>
    executeRequest<Instance>({
        path: '/api/v1/instances',
        method: 'POST',
        body: props,
    });

export const listInstanceTemplates = async () =>
    executeRequest<InstanceTemplate[]>({
        path: '/api/v1/instance-templates',
        method: 'GET',
    });

export const listInstances = async (props: {
    orderBy: 'creationDate' | 'lastConnectionDate' | 'name';
    order: 'asc' | 'desc';
    resultsPerPage: number;
    page: number;
    ownerId?: string;
}) =>
    executeRequest<SeekPaginated<Instance>>({
        path: `/api/v1/instances`,
        method: 'GET',
        queryParams: props,
    });

export const rebootInstance = async (props: { instanceId: string }) =>
    executeRequest<void>({
        path: `/api/v1/instances/${props.instanceId}/reboot`,
        method: 'POST',
    });

export const turnInstanceOff = async (props: { instanceId: string }) =>
    executeRequest<{ state: VirtualInstanceState }>({
        path: `/api/v1/instances/${props.instanceId}/turn-off`,
        method: 'POST',
    });

export const turnInstanceOn = async (props: { instanceId: string }) =>
    executeRequest<{ state: VirtualInstanceState }>({
        path: `/api/v1/instances/${props.instanceId}/turn-on`,
        method: 'POST',
    });

// USER MODULE

export const getUser = async (props: { userId: string | 'me' }) =>
    executeRequest<User>({
        path: `/api/v1/users/${props.userId}`,
        method: 'GET',
    });

export const listUsers = async (props: {
    orderBy: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'name';
    order: 'asc' | 'desc';
    resultsPerPage: number;
    page: number;
    groupId?: string;
    textQuery?: string;
}) =>
    executeRequest<SeekPaginated<User>>({
        path: '/api/v1/users',
        method: 'GET',
        queryParams: props,
    });

export const updateUserQuotas = async (props: {
    userId: string | 'me';
    maxInstances?: number;
    allowedInstanceTypes?: string[];
    canLaunchInstanceWithHibernation?: boolean;
}) =>
    executeRequest<User>({
        path: `/api/v1/users/${props.userId}/quotas`,
        method: 'PATCH',
        body: {
            maxInstances: props.maxInstances,
            allowedInstanceTypes: props.allowedInstanceTypes,
            canLaunchInstanceWithHibernation: props.canLaunchInstanceWithHibernation,
        },
    });

export const updateUserRole = async (props: { userId: string | 'me'; role: Role }) =>
    executeRequest<User>({
        path: `/api/v1/users/${props.userId}/role`,
        method: 'PATCH',
        body: { role: props.role },
    });
