import { Auth } from 'aws-amplify';
import {
    ApiResponse,
    Group,
    Instance,
    InstanceConnection,
    Product,
    ProductProvisioningParameter,
    SeekPaginated,
    UrlPath,
    User,
    UserQuota,
    UserRole,
} from './protocols';

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

        const session = await Auth.currentSession();
        const idToken = session.getIdToken().getJwtToken();

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
            return { error: reason, data: undefined };
        }

        return {
            data: (await response.json()) as T,
            error: undefined,
        };
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Error while fetching API data: ${reason}`);
        return { error: reason, data: undefined };
    }
};

export const listUsers = async (pagination: { resultsPerPage: number; page: number }) =>
    executeRequest<SeekPaginated<User>>({
        path: '/api/v1/users',
        method: 'GET',
        queryParams: { resultsPerPage: pagination.resultsPerPage, page: pagination.page },
    });

export const listUserGroups = async (
    userId: string | number | undefined,
    pagination: { resultsPerPage: number; page: number },
) =>
    executeRequest<SeekPaginated<Group>>({
        path: `/api/v1/users/${userId ?? 'me'}/groups`,
        method: 'GET',
        queryParams: { resultsPerPage: pagination.resultsPerPage, page: pagination.page },
    });

export const listUserInstances = async (
    userId: string | number | undefined,
    pagination: { resultsPerPage: number; page: number },
) =>
    executeRequest<SeekPaginated<Instance>>({
        path: `/api/v1/users/${userId ?? 'me'}/instances`,
        method: 'GET',
        queryParams: { resultsPerPage: pagination.resultsPerPage, page: pagination.page },
    });

export const updateUserRole = async (userId: string | number, role: keyof typeof UserRole) =>
    executeRequest({
        path: `/api/v1/users/${userId}/role`,
        method: 'PATCH',
        body: { role },
    });

export const listGroups = async (pagination: { resultsPerPage: number; page: number }) =>
    executeRequest<SeekPaginated<Group>>({
        path: '/api/v1/groups',
        method: 'GET',
        queryParams: { resultsPerPage: pagination.resultsPerPage, page: pagination.page },
    });

export const createGroup = async (data: Pick<Group, 'name' | 'description' | 'awsPortfolioId'>) =>
    executeRequest<Group>({
        path: '/api/v1/groups',
        method: 'POST',
        body: data,
    });

export const deleteGroup = async (groupId: number) =>
    executeRequest({
        path: `/api/v1/groups/${groupId}`,
        method: 'DELETE',
    });

export const getUserQuota = async (userId: string | number | undefined) =>
    executeRequest<UserQuota>({
        path: `/api/v1/users/${userId ?? 'me'}/quota`,
        method: 'GET',
    });

export const changeInstanceState = async (
    userId: string | number | undefined,
    instanceId: number,
    state: 'start' | 'stop' | 'reboot',
) =>
    executeRequest({
        path: `/api/v1/users/${userId ?? 'me'}/instances/${instanceId}/state`,
        method: 'POST',
        body: { state },
    });

export const deleteInstance = async (userId: string | number | undefined, instanceId: number) =>
    executeRequest({
        path: `/api/v1/users/${userId ?? 'me'}/instances/${instanceId}`,
        method: 'DELETE',
    });

export const getInstanceConnection = async (
    userId: string | number | undefined,
    instanceId: number,
) =>
    executeRequest<InstanceConnection>({
        path: `/api/v1/users/${userId ?? 'me'}/instances/${instanceId}/connection`,
        method: 'GET',
    });

export const listUserProducts = async (userId: string | number | undefined) =>
    executeRequest<Product[]>({
        path: `/api/v1/users/${userId ?? 'me'}/products`,
        method: 'GET',
    });

export const getProductProvisioningParameters = async (productId: string) =>
    executeRequest<ProductProvisioningParameter[]>({
        path: `/api/v1/products/${productId}/provisioning-parameters`,
        method: 'GET',
    });
