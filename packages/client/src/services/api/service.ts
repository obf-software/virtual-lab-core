import { Auth } from 'aws-amplify';
import {
    ApiResponse,
    Group,
    Instance,
    InstanceConnection,
    Portfolio,
    Product,
    ProductProvisioningParameter,
    Role,
    SeekPaginated,
    SeekPaginationInput,
    UrlPath,
    User,
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

        let data = undefined;

        try {
            data = (await response.json()) as T;
        } catch (error) {
            console.error(`Api call to ${props.path} returned invalid JSON`);
            data = {} as T;
        }

        return {
            data,
            error: undefined,
        };
    } catch (error) {
        const reason = getErrorMessage(error);
        console.log(`Error while fetching API data: ${reason}`);
        return { error: reason, data: undefined };
    }
};

// GROUP MODULE

export const createGroup = async (data: Pick<Group, 'name' | 'description' | 'portfolioId'>) =>
    executeRequest<Group>({
        path: '/api/v1/groups',
        method: 'POST',
        body: data,
    });

export const deleteGroup = async (groupId: number) =>
    executeRequest<void>({
        path: `/api/v1/groups/${groupId}`,
        method: 'DELETE',
    });

export const linkUsersToGroup = async (groupId: number, userIds: number[]) =>
    executeRequest<void>({
        path: `/api/v1/groups/${groupId}/link-users`,
        method: 'POST',
        body: { userIds },
    });

export const listGroups = async (pagination: SeekPaginationInput) =>
    executeRequest<SeekPaginated<Group>>({
        path: '/api/v1/groups',
        method: 'GET',
        queryParams: { ...pagination },
    });

export const listUserGroups = async (userId: number | 'me', pagination: SeekPaginationInput) =>
    executeRequest<SeekPaginated<Group>>({
        path: `/api/v1/users/${userId}/groups`,
        method: 'GET',
        queryParams: { ...pagination },
    });

export const unlinkUsersFromGroup = async (groupId: number, userIds: number[]) =>
    executeRequest<void>({
        path: `/api/v1/groups/${groupId}/unlink-users`,
        method: 'POST',
        body: { userIds },
    });

export const updateGroup = async (
    groupId: number,
    data: Partial<Pick<Group, 'name' | 'description'>>,
) =>
    executeRequest<Group>({
        path: `/api/v1/groups/${groupId}`,
        method: 'PATCH',
        body: { ...data },
    });

// INSTANCE MODULE

export const deleteInstance = async (userId: number | 'me', instanceId: number) =>
    executeRequest<void>({
        path: `/api/v1/users/${userId}/instances/${instanceId}`,
        method: 'DELETE',
    });

export const getInstanceConnection = async (userId: number | 'me', instanceId: number) =>
    executeRequest<InstanceConnection>({
        path: `/api/v1/users/${userId}/instances/${instanceId}/connection`,
        method: 'GET',
    });

export const listUserInstances = async (userId: number | 'me', pagination: SeekPaginationInput) =>
    executeRequest<SeekPaginated<Instance>>({
        path: `/api/v1/users/${userId}/instances`,
        method: 'GET',
        queryParams: { ...pagination },
    });

export const rebootInstance = async (userId: number | 'me', instanceId: number) =>
    executeRequest<void>({
        path: `/api/v1/users/${userId}/instances/${instanceId}/reboot`,
        method: 'POST',
    });

export const turnInstanceOff = async (userId: number | 'me', instanceId: number) =>
    executeRequest<void>({
        path: `/api/v1/users/${userId}/instances/${instanceId}/turn-off`,
        method: 'POST',
    });

export const turnInstanceOn = async (userId: number | 'me', instanceId: number) =>
    executeRequest<void>({
        path: `/api/v1/users/${userId}/instances/${instanceId}/turn-on`,
        method: 'POST',
    });

// PRODUCT MODULE

export const getProductProvisioningParameters = async (productId: string) =>
    executeRequest<ProductProvisioningParameter[]>({
        path: `/api/v1/products/${productId}/provisioning-parameters`,
        method: 'GET',
    });

export const listPortfolios = async () =>
    executeRequest<Portfolio[]>({
        path: `/api/v1/portfolios`,
        method: 'GET',
    });

export const listUserProducts = async (userId: number | 'me') =>
    executeRequest<Product[]>({
        path: `/api/v1/users/${userId}/products`,
        method: 'GET',
    });

export const provisionProduct = async (
    userId: number | 'me',
    productId: string,
    parameters: Record<string, string>,
) =>
    executeRequest<Instance>({
        path: `/api/v1/products/${productId}/provision`,
        method: 'POST',
        body: { userId, parameters },
    });

// USER MODULE

export const getUser = async (userId: number | 'me') =>
    executeRequest<User>({
        path: `/api/v1/users/${userId}`,
        method: 'GET',
    });

export const listGroupUsers = async (groupId: number, pagination: SeekPaginationInput) =>
    executeRequest<SeekPaginated<User>>({
        path: `/api/v1/groups/${groupId}/users`,
        method: 'GET',
        queryParams: { ...pagination },
    });

export const listUsers = async (pagination: SeekPaginationInput) =>
    executeRequest<SeekPaginated<User>>({
        path: '/api/v1/users',
        method: 'GET',
        queryParams: { ...pagination },
    });

export const updateUserQuotas = async (userId: number | 'me', maxInstances: number) =>
    executeRequest<User>({
        path: `/api/v1/users/${userId}/quotas`,
        method: 'PATCH',
        body: { maxInstances },
    });

export const updateUserRole = async (userId: string | number, role: keyof typeof Role) =>
    executeRequest<User>({
        path: `/api/v1/users/${userId}/role`,
        method: 'PATCH',
        body: { role },
    });
