import { APIGatewayProxyEventV2WithRequestContext } from 'aws-lambda';

export class TestEventFactory {
    static readonly createAPIGatewayProxyEventV2 = <T>(
        overrides: Partial<APIGatewayProxyEventV2WithRequestContext<T>> = {},
    ): APIGatewayProxyEventV2WithRequestContext<T> => ({
        version: overrides.version ?? '2.0',
        routeKey: overrides.routeKey ?? '',
        rawPath: overrides.rawPath ?? '/',
        rawQueryString: overrides.rawQueryString ?? '',
        cookies: overrides.cookies ?? [],
        headers: overrides.headers ?? {},
        queryStringParameters: overrides.queryStringParameters ?? undefined,
        requestContext: overrides.requestContext ?? ({} as T),
        body: overrides.body ?? undefined,
        pathParameters: overrides.pathParameters ?? undefined,
        isBase64Encoded: overrides.isBase64Encoded ?? false,
        stageVariables: overrides.stageVariables ?? undefined,
    });
}
