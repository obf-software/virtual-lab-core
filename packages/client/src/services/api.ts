import { fetchAuthSession } from 'aws-amplify/auth';
import {
    ApiResponse,
    Instance,
    InstanceConnection,
    InstanceTemplate,
    Role,
    SeekPaginated,
    UrlPath,
    User,
    InstanceState,
    InstanceType,
    MachineImage,
} from './api-protocols';
import { getErrorMessage } from './helpers';

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
    name: string;
    description: string;
    canHibernate: boolean;
    instanceType: string;
    ownerId: string;
}) =>
    executeRequest<Instance>({
        path: '/api/v1/instances',
        method: 'POST',
        body: props,
    });

export const listInstances = async (props: {
    orderBy: 'creationDate' | 'lastConnectionDate' | 'alphabetical';
    order: 'asc' | 'desc';
    resultsPerPage: number;
    page: number;
    ownerId?: string;
    textSearch?: string;
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
    executeRequest<{ state: InstanceState }>({
        path: `/api/v1/instances/${props.instanceId}/turn-off`,
        method: 'POST',
    });

export const turnInstanceOn = async (props: { instanceId: string }) =>
    executeRequest<{ state: InstanceState }>({
        path: `/api/v1/instances/${props.instanceId}/turn-on`,
        method: 'POST',
    });

// INSTANCE TEMPLATE MODULE

export const createInstanceTemplateFromInstance = async (props: {
    instanceId: string;
    name: string;
    description: string;
    storageInGb?: number;
}) =>
    executeRequest<InstanceTemplate>({
        path: `/api/v1/instances/${props.instanceId}/create-instance-template`,
        method: 'POST',
        body: props,
    });

export const createInstanceTemplate = async (props: {
    name: string;
    description: string;
    machineImageId: string;
    storageInGb?: number;
}) =>
    executeRequest<InstanceTemplate>({
        path: '/api/v1/instance-templates',
        method: 'POST',
        body: props,
    });

export const deleteInstanceTemplate = async (props: { instanceTemplateId: string }) =>
    executeRequest<void>({
        path: `/api/v1/instance-templates/${props.instanceTemplateId}`,
        method: 'DELETE',
    });

export const getInstanceTemplate = async (props: { instanceTemplateId: string }) =>
    executeRequest<InstanceTemplate>({
        path: `/api/v1/instance-templates/${props.instanceTemplateId}`,
        method: 'GET',
    });

export const listInstanceTemplates = async (props: {
    createdBy?: string;
    textSearch?: string;
    orderBy?: 'creationDate' | 'lastUpdateDate' | 'alphabetical';
    order?: 'asc' | 'desc';
    resultsPerPage: number;
    page: number;
}) =>
    executeRequest<SeekPaginated<InstanceTemplate>>({
        path: '/api/v1/instance-templates',
        method: 'GET',
        queryParams: props,
    });

export const updateInstanceTemplate = async (props: {
    instanceTemplateId: string;
    name?: string;
    description?: string;
}) =>
    executeRequest<InstanceTemplate>({
        path: `/api/v1/instance-templates/${props.instanceTemplateId}`,
        method: 'PATCH',
        body: props,
    });

// USER MODULE

export const getUser = async (props: { userId: string }) =>
    executeRequest<User>({
        path: `/api/v1/users/${props.userId}`,
        method: 'GET',
    });

export const listUsers = async (props: {
    orderBy: 'creationDate' | 'lastUpdateDate' | 'lastLoginDate' | 'alphabetical';
    order: 'asc' | 'desc';
    resultsPerPage: number;
    page: number;
    textSearch?: string;
}) =>
    executeRequest<SeekPaginated<User>>({
        path: '/api/v1/users',
        method: 'GET',
        queryParams: props,
    });

export const updateUserQuotas = async (props: {
    userId: string;
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

export const updateUserRole = async (props: { userId: string; role: Role }) =>
    executeRequest<User>({
        path: `/api/v1/users/${props.userId}/role`,
        method: 'PATCH',
        body: { role: props.role },
    });

/**
 * Misc module
 */
export const listInstanceTypes = async () =>
    executeRequest<InstanceType[]>({
        path: '/api/v1/instance-types',
        method: 'GET',
    });

export const listRecommendedMachineImages = async () =>
    executeRequest<MachineImage[]>({
        path: '/api/v1/recommended-machine-images',
        method: 'GET',
    });
