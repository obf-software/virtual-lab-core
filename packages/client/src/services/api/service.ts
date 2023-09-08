import { ApiResponse, AuthorizationHeader, Paginated, UrlPath, UserRole } from './protocols';

const executeRequest = async <T>(props: {
    path: UrlPath;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
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
            return { error: reason };
        }

        return {
            data: (await response.json()) as T,
        };
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Error while fetching CMS data: ${reason}`);
        return { error: reason };
    }
};

export const listUsers = (props: { authToken: string; take: number; cursor?: string }) =>
    executeRequest<
        Paginated<{
            id: string;
            username: string;
            role: UserRole;
            createdAt: string;
            updatedAt: string;
            lastLoginAt?: string;
        }>
    >({
        path: '/api/v1/users',
        method: 'GET',
        headers: {
            Authorization: `Bearer ${props.authToken}`,
        },
        queryParams: {
            take: props.take,
            cursor: props.cursor,
        },
    });
