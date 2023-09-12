import {
    ApiResponse,
    AuthorizationHeader,
    Group,
    SeekPaginated,
    UrlPath,
    User,
    UserRole,
} from './protocols';

const executeRequest = async <T>(props: {
    path: UrlPath;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    queryParams?: Record<string, string | number | undefined>;
    headers: {
        Authorization: AuthorizationHeader;
        [key: string]: string;
    };
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

        const response = await fetch(url, {
            method: props.method,
            body: props.body !== undefined ? JSON.stringify(props.body) : undefined,
            headers: props.headers,
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
        console.log(`Error while fetching CMS data: ${reason}`);
        return { error: reason, data: undefined };
    }
};

export const listUsers = async (
    idToken: string,
    pagination: { resultsPerPage: number; page: number },
) =>
    executeRequest<SeekPaginated<User>>({
        path: '/api/v1/users',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        queryParams: { resultsPerPage: pagination.resultsPerPage, page: pagination.page },
    });

export const listUserGroups = async (
    idToken: string,
    userId: string | number | undefined,
    pagination: { resultsPerPage: number; page: number },
) =>
    executeRequest<SeekPaginated<Group>>({
        path: `/api/v1/users/${userId ?? 'me'}/groups`,
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        queryParams: { resultsPerPage: pagination.resultsPerPage, page: pagination.page },
    });

export const updateUserRole = async (
    idToken: string,
    userId: string | number,
    role: keyof typeof UserRole,
) =>
    executeRequest({
        path: `/api/v1/users/${userId}/role`,
        method: 'PATCH',
        headers: { Authorization: `Bearer ${idToken}` },
        body: { role },
    });

export const listGroups = async (
    idToken: string,
    pagination: { resultsPerPage: number; page: number },
) =>
    executeRequest<SeekPaginated<Group>>({
        path: '/api/v1/groups',
        method: 'GET',
        headers: { Authorization: `Bearer ${idToken}` },
        queryParams: { resultsPerPage: pagination.resultsPerPage, page: pagination.page },
    });
